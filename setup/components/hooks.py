"""
Hooks component for Claude Code hooks integration (future-ready)
"""

from typing import Dict, List, Tuple, Any
from pathlib import Path

from ..base.component import Component
from ..core.file_manager import FileManager
from ..core.settings_manager import SettingsManager
from ..utils.security import SecurityValidator
from ..utils.logger import get_logger


class HooksComponent(Component):
    """Claude Code hooks integration component"""
    
    def __init__(self, install_dir: Path = None):
        """Initialize hooks component"""
        super().__init__(install_dir)
        self.logger = get_logger()
        self.file_manager = FileManager()
        self.settings_manager = SettingsManager(self.install_dir)
        
        # Define hook files to install
        self.hook_files = [
            "morph_tool_interceptor.py",    # PreToolUse hook for MorphLLM routing
            "morph_performance_monitor.py", # PostToolUse hook for performance tracking
            "morph_error_handler.py"        # Error handling hook for MorphLLM fallbacks
        ]
    
    def get_metadata(self) -> Dict[str, str]:
        """Get component metadata"""
        return {
            "name": "hooks",
            "version": "3.0.0",
            "description": "Claude Code hooks integration with MorphLLM tool interception and performance monitoring",
            "category": "integration"
        }
    
    def validate_prerequisites(self) -> Tuple[bool, List[str]]:
        """Check prerequisites"""
        errors = []
        
        # Check if source directory exists (when hooks are implemented)
        source_dir = self._get_source_dir()
        if not source_dir.exists():
            # This is expected for now - hooks are future-ready
            self.logger.debug(f"Hooks source directory not found: {source_dir} (expected for future implementation)")
        
        # Check write permissions to install directory
        hooks_dir = self.install_dir / "hooks"
        has_perms, missing = SecurityValidator.check_permissions(
            self.install_dir, {'write'}
        )
        if not has_perms:
            errors.append(f"No write permissions to {self.install_dir}: {missing}")
        
        # Validate installation target
        is_safe, validation_errors = SecurityValidator.validate_installation_target(hooks_dir)
        if not is_safe:
            errors.extend(validation_errors)
        
        return len(errors) == 0, errors
    
    def get_files_to_install(self) -> List[Tuple[Path, Path]]:
        """Get files to install"""
        source_dir = self._get_source_dir()
        files = []
        
        # Only include files that actually exist
        for filename in self.hook_files:
            source = source_dir / filename
            if source.exists():
                target = self.install_dir / "hooks" / filename
                files.append((source, target))
        
        return files
    
    def get_settings_modifications(self) -> Dict[str, Any]:
        """Get settings modifications for Claude Code hooks configuration"""
        hooks_dir = self.install_dir / "hooks"
        
        # Check which hook files exist
        existing_hooks = {}
        for filename in self.hook_files:
            hook_path = hooks_dir / filename
            if hook_path.exists():
                existing_hooks[filename] = str(hook_path)
        
        settings_mods = {}
        
        # Add metadata tracking (separate from Claude Code settings)
        metadata_mods = {
            "components": {
                "hooks": {
                    "version": "3.0.0",
                    "installed": True,
                    "files_count": len(existing_hooks)
                }
            }
        }
        
        # Add Claude Code hooks configuration if we have hook files
        if existing_hooks:
            hooks_config = {
                "hooks": {}
            }
            
            # Configure PreToolUse hooks (correct nested format)
            if "morph_tool_interceptor.py" in existing_hooks:
                hooks_config["hooks"]["PreToolUse"] = [
                    {
                        "matcher": "^(Read|Write|Edit|MultiEdit|LS|Glob)$",
                        "hooks": [
                            {
                                "type": "command",
                                "command": f"python3 {existing_hooks['morph_tool_interceptor.py']}"
                            }
                        ]
                    }
                ]
            
            # Configure PostToolUse hooks (correct nested format)
            if "morph_performance_monitor.py" in existing_hooks:
                hooks_config["hooks"]["PostToolUse"] = [
                    {
                        "matcher": ".*",
                        "hooks": [
                            {
                                "type": "command",
                                "command": f"python3 {existing_hooks['morph_performance_monitor.py']}"
                            }
                        ]
                    }
                ]
            
            settings_mods.update(hooks_config)
        
        # Return settings modifications (Claude Code settings.json format)
        return settings_mods
    
    def install(self, config: Dict[str, Any]) -> bool:
        """Install hooks component"""
        try:
            self.logger.info("Installing SuperClaude hooks component...")
            
            source_dir = self._get_source_dir()
            
            # Validate installation prerequisites
            success, errors = self.validate_prerequisites()
            if not success:
                for error in errors:
                    self.logger.error(error)
                return False
            
            # Ensure hooks directory exists
            hooks_dir = self.install_dir / "hooks"
            if not self.file_manager.ensure_directory(hooks_dir):
                self.logger.error(f"Could not create hooks directory: {hooks_dir}")
                return False
            
            # Check if hook source files exist
            if not source_dir.exists():
                self.logger.warning(f"Hook source directory not found: {source_dir}")
                self.logger.info("Installing placeholder hooks component")
                
                # Create placeholder file for future implementation
                placeholder_content = '''"""
SuperClaude Hooks - Future Implementation

This directory is reserved for Claude Code hooks integration.
Hooks will provide lifecycle management and automation capabilities.

For more information, see SuperClaude documentation.
"""

# Placeholder for future hooks implementation
def placeholder_hook():
    """Placeholder hook function"""
    pass
'''
                placeholder_path = hooks_dir / "PLACEHOLDER.py"
                try:
                    with open(placeholder_path, 'w') as f:
                        f.write(placeholder_content)
                    self.logger.debug("Created hooks placeholder file")
                except Exception as e:
                    self.logger.warning(f"Could not create placeholder file: {e}")
                
                # Register placeholder in metadata only (not in Claude Code settings)
                try:
                    self.settings_manager.add_component_registration("hooks", {
                        "version": "3.0.0",
                        "category": "integration",
                        "status": "placeholder",
                        "files_count": 0
                    })
                    self.logger.info("Registered hooks component in metadata")
                except Exception as e:
                    self.logger.error(f"Failed to register component: {e}")
                    return False
                
                self.logger.success("Hooks component installed successfully (placeholder)")
                return True
            
            # Install actual hook files
            self.logger.info("Installing MorphLLM hook files...")
            
            # Get files to install
            files_to_install = self.get_files_to_install()
            
            if not files_to_install:
                self.logger.warning("No hook files found to install")
                return self._install_placeholder_hooks()
            
            # Validate all files for security
            is_safe, security_errors = SecurityValidator.validate_component_files(
                files_to_install, source_dir, hooks_dir
            )
            if not is_safe:
                for error in security_errors:
                    self.logger.error(f"Security validation failed: {error}")
                return False
            
            # Copy hook files
            success_count = 0
            for source, target in files_to_install:
                self.logger.debug(f"Installing hook: {source.name} -> {target}")
                
                if self.file_manager.copy_file(source, target):
                    success_count += 1
                    # Make hook files executable
                    try:
                        target.chmod(0o755)
                        self.logger.debug(f"Made {source.name} executable")
                    except Exception as e:
                        self.logger.warning(f"Could not make {source.name} executable: {e}")
                else:
                    self.logger.error(f"Failed to install hook: {source.name}")
            
            if success_count != len(files_to_install):
                self.logger.error(f"Only {success_count}/{len(files_to_install)} hook files installed successfully")
                return False
            
            # Register component in metadata
            try:
                self.settings_manager.add_component_registration("hooks", {
                    "version": "3.0.0",
                    "category": "integration",
                    "status": "active",
                    "files_count": success_count
                })
                self.logger.info("Registered hooks component in metadata")
            except Exception as e:
                self.logger.error(f"Failed to register component: {e}")
                return False
            
            # Update Claude Code settings.json with hooks configuration
            try:
                settings_mods = self.get_settings_modifications()
                if settings_mods:
                    self.settings_manager.update_settings(settings_mods)
                    self.logger.info("Updated Claude Code settings.json with hooks configuration")
                    self.logger.info("MorphLLM hooks are now active for filesystem operations")
            except Exception as e:
                self.logger.error(f"Failed to update settings.json: {e}")
                return False
            
            self.logger.success(f"Hooks component installed successfully ({success_count} hook files)")
            return True
            
        except Exception as e:
            self.logger.exception(f"Unexpected error during hooks installation: {e}")
            return False
    
    def _install_placeholder_hooks(self) -> bool:
        """Install placeholder hooks when actual hooks are not available"""
        try:
            hooks_dir = self.install_dir / "hooks"
            
            # Create placeholder file
            placeholder_content = '''"""
SuperClaude Hooks - Future Implementation
"""

def placeholder_hook():
    pass
'''
            placeholder_path = hooks_dir / "PLACEHOLDER.py"
            with open(placeholder_path, 'w') as f:
                f.write(placeholder_content)
            
            # Register placeholder component
            self.settings_manager.add_component_registration("hooks", {
                "version": "3.0.0",
                "category": "integration", 
                "status": "placeholder",
                "files_count": 0
            })
            
            self.logger.success("Hooks component installed successfully (placeholder)")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to install placeholder hooks: {e}")
            return False
    
    def uninstall(self) -> bool:
        """Uninstall hooks component"""
        try:
            self.logger.info("Uninstalling SuperClaude hooks component...")
            
            # Remove hook files and placeholder
            hooks_dir = self.install_dir / "hooks"
            removed_count = 0
            
            # Remove actual hook files
            for filename in self.hook_files:
                file_path = hooks_dir / filename
                if self.file_manager.remove_file(file_path):
                    removed_count += 1
                    self.logger.debug(f"Removed {filename}")
            
            # Remove placeholder file
            placeholder_path = hooks_dir / "PLACEHOLDER.py"
            if self.file_manager.remove_file(placeholder_path):
                removed_count += 1
                self.logger.debug("Removed hooks placeholder")
            
            # Remove hooks directory if empty
            try:
                if hooks_dir.exists():
                    remaining_files = list(hooks_dir.iterdir())
                    if not remaining_files:
                        hooks_dir.rmdir()
                        self.logger.debug("Removed empty hooks directory")
            except Exception as e:
                self.logger.warning(f"Could not remove hooks directory: {e}")
            
            # Update settings.json to remove hooks component and configuration
            try:
                if self.settings_manager.is_component_installed("hooks"):
                    self.settings_manager.remove_component_registration("hooks")
                    
                    # Also remove hooks configuration section if it exists
                    settings = self.settings_manager.load_settings()
                    if "hooks" in settings:
                        del settings["hooks"]
                        self.settings_manager.save_settings(settings)
                    
                    self.logger.info("Removed hooks component and configuration from settings.json")
            except Exception as e:
                self.logger.warning(f"Could not update settings.json: {e}")
            
            self.logger.success(f"Hooks component uninstalled ({removed_count} files removed)")
            return True
            
        except Exception as e:
            self.logger.exception(f"Unexpected error during hooks uninstallation: {e}")
            return False
    
    def get_dependencies(self) -> List[str]:
        """Get dependencies"""
        return ["core"]
    
    def update(self, config: Dict[str, Any]) -> bool:
        """Update hooks component"""
        try:
            self.logger.info("Updating SuperClaude hooks component...")
            
            # Check current version
            current_version = self.settings_manager.get_component_version("hooks")
            target_version = self.get_metadata()["version"]
            
            if current_version == target_version:
                self.logger.info(f"Hooks component already at version {target_version}")
                return True
            
            self.logger.info(f"Updating hooks component from {current_version} to {target_version}")
            
            # Create backup of existing hook files
            hooks_dir = self.install_dir / "hooks"
            backup_files = []
            
            if hooks_dir.exists():
                for filename in self.hook_files + ["PLACEHOLDER.py"]:
                    file_path = hooks_dir / filename
                    if file_path.exists():
                        backup_path = self.file_manager.backup_file(file_path)
                        if backup_path:
                            backup_files.append(backup_path)
                            self.logger.debug(f"Backed up {filename}")
            
            # Perform installation (overwrites existing files)
            success = self.install(config)
            
            if success:
                # Remove backup files on successful update
                for backup_path in backup_files:
                    try:
                        backup_path.unlink()
                    except Exception:
                        pass  # Ignore cleanup errors
                
                self.logger.success(f"Hooks component updated to version {target_version}")
            else:
                # Restore from backup on failure
                self.logger.warning("Update failed, restoring from backup...")
                for backup_path in backup_files:
                    try:
                        original_path = backup_path.with_suffix('')
                        backup_path.rename(original_path)
                        self.logger.debug(f"Restored {original_path.name}")
                    except Exception as e:
                        self.logger.error(f"Could not restore {backup_path}: {e}")
            
            return success
            
        except Exception as e:
            self.logger.exception(f"Unexpected error during hooks update: {e}")
            return False
    
    def validate_installation(self) -> Tuple[bool, List[str]]:
        """Validate hooks component installation"""
        errors = []
        
        # Check if hooks directory exists
        hooks_dir = self.install_dir / "hooks"
        if not hooks_dir.exists():
            errors.append("Hooks directory not found")
            return False, errors
        
        # Check settings.json registration
        if not self.settings_manager.is_component_installed("hooks"):
            errors.append("Hooks component not registered in settings.json")
        else:
            # Check version matches
            installed_version = self.settings_manager.get_component_version("hooks")
            expected_version = self.get_metadata()["version"]
            if installed_version != expected_version:
                errors.append(f"Version mismatch: installed {installed_version}, expected {expected_version}")
        
        # Check if we have either actual hooks or placeholder
        has_placeholder = (hooks_dir / "PLACEHOLDER.py").exists()
        has_actual_hooks = any((hooks_dir / filename).exists() for filename in self.hook_files)
        
        if not has_placeholder and not has_actual_hooks:
            errors.append("No hook files or placeholder found")
        
        return len(errors) == 0, errors
    
    def _get_source_dir(self) -> Path:
        """Get source directory for hook files"""
        # Assume we're in SuperClaude/setup/components/hooks.py
        # and hook files are in SuperClaude/SuperClaude/Hooks/
        project_root = Path(__file__).parent.parent.parent
        return project_root / "SuperClaude" / "Hooks"
    
    def get_size_estimate(self) -> int:
        """Get estimated installation size"""
        # Estimate based on placeholder or actual files
        source_dir = self._get_source_dir()
        total_size = 0
        
        if source_dir.exists():
            for filename in self.hook_files:
                file_path = source_dir / filename
                if file_path.exists():
                    total_size += file_path.stat().st_size
        
        # Add placeholder overhead or minimum size
        total_size = max(total_size, 10240)  # At least 10KB
        
        return total_size
    
    def get_installation_summary(self) -> Dict[str, Any]:
        """Get installation summary"""
        source_dir = self._get_source_dir()
        status = "placeholder" if not source_dir.exists() else "implemented"
        
        return {
            "component": self.get_metadata()["name"],
            "version": self.get_metadata()["version"],
            "status": status,
            "hook_files": self.hook_files if source_dir.exists() else ["PLACEHOLDER.py"],
            "estimated_size": self.get_size_estimate(),
            "install_directory": str(self.install_dir / "hooks"),
            "dependencies": self.get_dependencies()
        }