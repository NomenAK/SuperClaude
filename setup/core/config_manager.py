"""
Configuration management for SuperClaude installation system
"""

import json
from typing import Dict, Any, List, Optional
from pathlib import Path

# Handle jsonschema import - if not available, use basic validation
try:
    import jsonschema
    from jsonschema import validate, ValidationError
    JSONSCHEMA_AVAILABLE = True
except ImportError:
    JSONSCHEMA_AVAILABLE = False
    
    class ValidationError(Exception):
        """Simple validation error for when jsonschema is not available"""
        def __init__(self, message):
            self.message = message
            super().__init__(message)
    
    def validate(instance, schema):
        """Dummy validation function"""
        # Basic type checking only
        if "type" in schema:
            expected_type = schema["type"]
            if expected_type == "object" and not isinstance(instance, dict):
                raise ValidationError(f"Expected object, got {type(instance).__name__}")
            elif expected_type == "array" and not isinstance(instance, list):
                raise ValidationError(f"Expected array, got {type(instance).__name__}")
            elif expected_type == "string" and not isinstance(instance, str):
                raise ValidationError(f"Expected string, got {type(instance).__name__}")
            elif expected_type == "integer" and not isinstance(instance, int):
                raise ValidationError(f"Expected integer, got {type(instance).__name__}")
        # Skip detailed validation if jsonschema not available


class ConfigManager:
    """Manages configuration files and validation"""
    
    def __init__(self, config_dir: Path):
        """
        Initialize config manager
        
        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = config_dir
        self.features_file = config_dir / "features.json"
        self.requirements_file = config_dir / "requirements.json"
        self._features_cache = None
        self._requirements_cache = None
        
        # Schema for features.json
        self.features_schema = {
            "type": "object",
            "properties": {
                "components": {
                    "type": "object",
                    "patternProperties": {
                        "^[a-zA-Z_][a-zA-Z0-9_]*$": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "version": {"type": "string"},
                                "description": {"type": "string"},
                                "category": {"type": "string"},
                                "dependencies": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "enabled": {"type": "boolean"},
                                "required_tools": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "api_requirements": {
                                    "type": "object",
                                    "patternProperties": {
                                        "^[a-zA-Z_][a-zA-Z0-9_]*$": {
                                            "type": "object",
                                            "properties": {
                                                "env_var": {"type": "string"},
                                                "description": {"type": "string"},
                                                "required": {"type": "boolean"},
                                                "obtain_url": {"type": "string"}
                                            },
                                            "additionalProperties": False
                                        }
                                    }
                                },
                                "configuration": {
                                    "type": "object",
                                    "additionalProperties": True
                                },
                                "hook_types": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            },
                            "required": ["name", "version", "description", "category"],
                            "additionalProperties": False
                        }
                    }
                }
            },
            "required": ["components"],
            "additionalProperties": False
        }
        
        # Schema for requirements.json
        self.requirements_schema = {
            "type": "object",
            "properties": {
                "python": {
                    "type": "object",
                    "properties": {
                        "min_version": {"type": "string"},
                        "max_version": {"type": "string"}
                    },
                    "required": ["min_version"]
                },
                "node": {
                    "type": "object",
                    "properties": {
                        "min_version": {"type": "string"},
                        "max_version": {"type": "string"},
                        "required_for": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["min_version"]
                },
                "disk_space_mb": {"type": "integer"},
                "external_tools": {
                    "type": "object",
                    "patternProperties": {
                        "^[a-zA-Z_][a-zA-Z0-9_-]*$": {
                            "type": "object",
                            "properties": {
                                "command": {"type": "string"},
                                "min_version": {"type": "string"},
                                "required_for": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "optional": {"type": "boolean"},
                                "description": {"type": "string"}
                            },
                            "required": ["command"],
                            "additionalProperties": False
                        }
                    }
                },
                "api_keys": {
                    "type": "object",
                    "patternProperties": {
                        "^[a-zA-Z_][a-zA-Z0-9_]*$": {
                            "type": "object",
                            "properties": {
                                "env_var": {"type": "string"},
                                "description": {"type": "string"},
                                "required_for": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "optional": {"type": "boolean"},
                                "obtain_url": {"type": "string"},
                                "validation_command": {"type": "string"}
                            },
                            "additionalProperties": False
                        }
                    }
                },
                "installation_commands": {
                    "type": "object",
                    "patternProperties": {
                        "^[a-zA-Z_][a-zA-Z0-9_-]*$": {
                            "type": "object",
                            "properties": {
                                "linux": {"type": "string"},
                                "darwin": {"type": "string"},
                                "win32": {"type": "string"},
                                "all": {"type": "string"},
                                "description": {"type": "string"},
                                "post_install": {"type": "string"},
                                "example": {"type": "string"}
                            },
                            "additionalProperties": False
                        }
                    }
                }
            },
            "required": ["python", "disk_space_mb"],
            "additionalProperties": False
        }
    
    def load_features(self) -> Dict[str, Any]:
        """
        Load and validate features configuration
        
        Returns:
            Features configuration dict
            
        Raises:
            FileNotFoundError: If features.json not found
            ValidationError: If features.json is invalid
        """
        if self._features_cache is not None:
            return self._features_cache
            
        if not self.features_file.exists():
            raise FileNotFoundError(f"Features config not found: {self.features_file}")
        
        try:
            with open(self.features_file, 'r') as f:
                features = json.load(f)
                
            # Validate schema
            validate(instance=features, schema=self.features_schema)
            
            self._features_cache = features
            return features
            
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON in {self.features_file}: {e}")
        except ValidationError as e:
            raise ValidationError(f"Invalid features schema: {e.message}")
    
    def load_requirements(self) -> Dict[str, Any]:
        """
        Load and validate requirements configuration
        
        Returns:
            Requirements configuration dict
            
        Raises:
            FileNotFoundError: If requirements.json not found
            ValidationError: If requirements.json is invalid
        """
        if self._requirements_cache is not None:
            return self._requirements_cache
            
        if not self.requirements_file.exists():
            raise FileNotFoundError(f"Requirements config not found: {self.requirements_file}")
        
        try:
            with open(self.requirements_file, 'r') as f:
                requirements = json.load(f)
                
            # Validate schema
            validate(instance=requirements, schema=self.requirements_schema)
            
            self._requirements_cache = requirements
            return requirements
            
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON in {self.requirements_file}: {e}")
        except ValidationError as e:
            raise ValidationError(f"Invalid requirements schema: {e.message}")
    
    def get_component_info(self, component_name: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific component
        
        Args:
            component_name: Name of component
            
        Returns:
            Component info dict or None if not found
        """
        features = self.load_features()
        return features.get("components", {}).get(component_name)
    
    def get_enabled_components(self) -> List[str]:
        """
        Get list of enabled component names
        
        Returns:
            List of enabled component names
        """
        features = self.load_features()
        enabled = []
        
        for name, info in features.get("components", {}).items():
            if info.get("enabled", True):  # Default to enabled
                enabled.append(name)
                
        return enabled
    
    def get_components_by_category(self, category: str) -> List[str]:
        """
        Get component names by category
        
        Args:
            category: Component category
            
        Returns:
            List of component names in category
        """
        features = self.load_features()
        components = []
        
        for name, info in features.get("components", {}).items():
            if info.get("category") == category:
                components.append(name)
                
        return components
    
    def get_component_dependencies(self, component_name: str) -> List[str]:
        """
        Get dependencies for a component
        
        Args:
            component_name: Name of component
            
        Returns:
            List of dependency component names
        """
        component_info = self.get_component_info(component_name)
        if component_info:
            return component_info.get("dependencies", [])
        return []
    
    def load_profile(self, profile_path: Path) -> Dict[str, Any]:
        """
        Load installation profile
        
        Args:
            profile_path: Path to profile JSON file
            
        Returns:
            Profile configuration dict
            
        Raises:
            FileNotFoundError: If profile not found
            ValidationError: If profile is invalid
        """
        if not profile_path.exists():
            raise FileNotFoundError(f"Profile not found: {profile_path}")
        
        try:
            with open(profile_path, 'r') as f:
                profile = json.load(f)
                
            # Basic validation
            if "components" not in profile:
                raise ValidationError("Profile must contain 'components' field")
                
            if not isinstance(profile["components"], list):
                raise ValidationError("Profile 'components' must be a list")
            
            # Validate that all components exist
            features = self.load_features()
            available_components = set(features.get("components", {}).keys())
            
            for component in profile["components"]:
                if component not in available_components:
                    raise ValidationError(f"Unknown component in profile: {component}")
            
            return profile
            
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON in {profile_path}: {e}")
    
    def get_system_requirements(self) -> Dict[str, Any]:
        """
        Get system requirements
        
        Returns:
            System requirements dict
        """
        return self.load_requirements()
    
    def get_requirements_for_components(self, component_names: List[str]) -> Dict[str, Any]:
        """
        Get consolidated requirements for specific components
        
        Args:
            component_names: List of component names
            
        Returns:
            Consolidated requirements dict
        """
        requirements = self.load_requirements()
        features = self.load_features()
        
        # Start with base requirements
        result = {
            "python": requirements["python"],
            "disk_space_mb": requirements["disk_space_mb"],
            "external_tools": {}
        }
        
        # Add Node.js requirements if needed
        node_required = False
        for component_name in component_names:
            component_info = features.get("components", {}).get(component_name, {})
            required_tools = component_info.get("required_tools", [])
            
            if "node" in required_tools:
                node_required = True
                break
        
        if node_required and "node" in requirements:
            result["node"] = requirements["node"]
        
        # Add external tool requirements
        for component_name in component_names:
            component_info = features.get("components", {}).get(component_name, {})
            required_tools = component_info.get("required_tools", [])
            
            for tool in required_tools:
                if tool in requirements.get("external_tools", {}):
                    result["external_tools"][tool] = requirements["external_tools"][tool]
        
        return result
    
    def validate_config_files(self) -> List[str]:
        """
        Validate all configuration files
        
        Returns:
            List of validation errors (empty if all valid)
        """
        errors = []
        
        try:
            self.load_features()
        except Exception as e:
            errors.append(f"Features config error: {e}")
        
        try:
            self.load_requirements()
        except Exception as e:
            errors.append(f"Requirements config error: {e}")
        
        return errors
    
    def clear_cache(self) -> None:
        """Clear cached configuration data"""
        self._features_cache = None
        self._requirements_cache = None