variable "DOCKER_REGISTRY" {
  default = ""
}

variable "VERSION" {
  default = "latest"
}

group "default" {
  targets = ["local"]
}

target "local" {
  context = "."
  dockerfile = "Dockerfile"
  tags = ["superclaude-mcp:local"]
  platforms = ["linux/amd64", "linux/arm64"]
  output = ["type=docker"]
}

target "development" {
  context = "."
  dockerfile = "Dockerfile"
  tags = ["superclaude-mcp:dev"]
  target = "builder"
  platforms = ["linux/amd64"]
}

target "registry" {
  context = "."
  dockerfile = "Dockerfile"
  tags = [
    "${DOCKER_REGISTRY}/superclaude-mcp:${VERSION}",
    "${DOCKER_REGISTRY}/superclaude-mcp:latest"
  ]
  platforms = ["linux/amd64", "linux/arm64"]
  cache-to = ["type=inline"]
  cache-from = ["type=registry,ref=${DOCKER_REGISTRY}/superclaude-mcp:buildcache"]
}