"""
Skill management utilities for uploading, validating, and versioning
custom skills via the Claude API.

Adapted from anthropics/claude-cookbooks.

Usage:
    from utils.skill_utils import create_skill, validate_skill_directory

    # Validate a skill before uploading
    result = validate_skill_directory("skills/offer-architecture")

    # Upload a skill
    client = Anthropic()
    skill = create_skill(client, "skills/offer-architecture", "Offer Architecture")
"""

from pathlib import Path
from typing import Any

from anthropic import Anthropic
from anthropic.lib import files_from_dir


def create_skill(client: Anthropic, skill_path: str, display_title: str) -> dict[str, Any]:
    """Upload a skill directory to the Claude API as a custom skill."""
    try:
        skill_dir = Path(skill_path)
        if not skill_dir.exists():
            return {"success": False, "error": f"Skill directory does not exist: {skill_path}"}
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            return {"success": False, "error": f"SKILL.md not found in {skill_path}"}
        skill = client.beta.skills.create(display_title=display_title, files=files_from_dir(skill_path))
        return {
            "success": True,
            "skill_id": skill.id,
            "display_title": skill.display_title,
            "latest_version": skill.latest_version,
            "created_at": skill.created_at,
            "source": skill.source,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def list_custom_skills(client: Anthropic) -> list[dict[str, Any]]:
    """List all custom skills uploaded to your account."""
    try:
        skills_response = client.beta.skills.list(source="custom")
        return [
            {
                "skill_id": s.id,
                "display_title": s.display_title,
                "latest_version": s.latest_version,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
            }
            for s in skills_response.data
        ]
    except Exception as e:
        print(f"Error listing skills: {e}")
        return []


def get_skill_version(client: Anthropic, skill_id: str, version: str = "latest") -> dict[str, Any] | None:
    """Get details about a specific skill version."""
    try:
        if version == "latest":
            skill = client.beta.skills.retrieve(skill_id)
            version = skill.latest_version
        version_info = client.beta.skills.versions.retrieve(skill_id=skill_id, version=version)
        return {
            "version": version_info.version,
            "skill_id": version_info.skill_id,
            "name": version_info.name,
            "description": version_info.description,
            "directory": version_info.directory,
            "created_at": version_info.created_at,
        }
    except Exception as e:
        print(f"Error getting skill version: {e}")
        return None


def create_skill_version(client: Anthropic, skill_id: str, skill_path: str) -> dict[str, Any]:
    """Upload a new version of an existing skill."""
    try:
        version = client.beta.skills.versions.create(skill_id=skill_id, files=files_from_dir(skill_path))
        return {
            "success": True,
            "version": version.version,
            "skill_id": version.skill_id,
            "created_at": version.created_at,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_skill(client: Anthropic, skill_id: str, delete_versions: bool = True) -> bool:
    """Delete a skill and optionally all its versions."""
    try:
        if delete_versions:
            versions = client.beta.skills.versions.list(skill_id=skill_id)
            for version in versions.data:
                client.beta.skills.versions.delete(skill_id=skill_id, version=version.version)
        client.beta.skills.delete(skill_id)
        return True
    except Exception as e:
        print(f"Error deleting skill: {e}")
        return False


def test_skill(client, skill_id, test_prompt, model="claude-sonnet-4-6", include_anthropic_skills=None):
    """Test a skill by running a prompt against it."""
    skills = [{"type": "custom", "skill_id": skill_id, "version": "latest"}]
    if include_anthropic_skills:
        for s in include_anthropic_skills:
            skills.append({"type": "anthropic", "skill_id": s, "version": "latest"})
    return client.beta.messages.create(
        model=model,
        max_tokens=4096,
        container={"skills": skills},
        tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
        messages=[{"role": "user", "content": test_prompt}],
        betas=["code-execution-2025-08-25", "files-api-2025-04-14", "skills-2025-10-02"],
    )


def validate_skill_directory(skill_path: str) -> dict[str, Any]:
    """Validate a skill directory before uploading.

    Checks:
    - Directory exists
    - SKILL.md exists with valid YAML frontmatter
    - Frontmatter has required name and description fields
    - Frontmatter is under 1024 chars
    - Total directory size is under 8MB
    """
    result = {"valid": True, "errors": [], "warnings": [], "info": {}}
    skill_dir = Path(skill_path)
    if not skill_dir.exists():
        result["valid"] = False
        result["errors"].append(f"Directory does not exist: {skill_path}")
        return result
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        result["valid"] = False
        result["errors"].append("SKILL.md file is required")
    else:
        content = skill_md.read_text()
        if not content.startswith("---"):
            result["valid"] = False
            result["errors"].append("SKILL.md must start with YAML frontmatter (---)")
        else:
            try:
                end_idx = content.index("---", 3)
                frontmatter = content[3:end_idx].strip()
                if "name:" not in frontmatter:
                    result["valid"] = False
                    result["errors"].append("YAML frontmatter must include 'name' field")
                if "description:" not in frontmatter:
                    result["valid"] = False
                    result["errors"].append("YAML frontmatter must include 'description' field")
                if len(frontmatter) > 1024:
                    result["valid"] = False
                    result["errors"].append("YAML frontmatter exceeds 1024 chars")
            except ValueError:
                result["valid"] = False
                result["errors"].append("Invalid YAML frontmatter format")
    total_size = sum(f.stat().st_size for f in skill_dir.rglob("*") if f.is_file())
    result["info"]["total_size_mb"] = total_size / (1024 * 1024)
    if total_size > 8 * 1024 * 1024:
        result["valid"] = False
        result["errors"].append("Total size exceeds 8MB limit")
    return result


def validate_all_skills(skills_dir: str = "skills") -> dict[str, dict[str, Any]]:
    """Validate all skill directories in the given path."""
    results = {}
    skills_path = Path(skills_dir)
    if not skills_path.exists():
        return {"error": f"Skills directory not found: {skills_dir}"}
    for skill_dir in sorted(skills_path.iterdir()):
        if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
            results[skill_dir.name] = validate_skill_directory(str(skill_dir))
    return results


def upload_all_skills(client: Anthropic, skills_dir: str = "skills") -> list[dict[str, Any]]:
    """Validate and upload all skills from a directory."""
    results = []
    skills_path = Path(skills_dir)
    for skill_dir in sorted(skills_path.iterdir()):
        if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
            validation = validate_skill_directory(str(skill_dir))
            if not validation["valid"]:
                results.append({"skill": skill_dir.name, "success": False, "errors": validation["errors"]})
                continue
            title = skill_dir.name.replace("-", " ").title()
            result = create_skill(client, str(skill_dir), title)
            result["skill"] = skill_dir.name
            results.append(result)
    return results
