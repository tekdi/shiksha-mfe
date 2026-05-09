from __future__ import annotations

import json
from io import BytesIO
from textwrap import dedent
from zipfile import ZIP_DEFLATED, ZipFile

from .models import AssessmentResponse, BrandingConfig, ChapterMarker, LessonBuildResponse, MultimediaResponse, PackageArtifact
from .storage import asset_url, save_bytes_file


def _zip_bytes(files: dict[str, str]) -> bytes:
    buffer = BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return buffer.getvalue()


def build_assessment_packages(title: str, assessment: AssessmentResponse) -> list[PackageArtifact]:
    slug = slugify(title)
    h5p_name = f"{slug}-question-set.h5p"
    scorm_name = f"{slug}-question-set-scorm.zip"

    h5p_content = {
        "title": title,
        "library": "H5P.QuestionSet 1.20",
        "questions": assessment.model_dump(),
    }
    h5p_bytes = _zip_bytes(
        {
            "h5p.json": json.dumps({"title": title, "language": "en", "mainLibrary": "H5P.QuestionSet"}, indent=2),
            "content/content.json": json.dumps(h5p_content, indent=2),
        }
    )
    save_bytes_file(h5p_name, h5p_bytes)

    html = f"<html><body><h1>{title}</h1><pre>{json.dumps(assessment.model_dump(), indent=2)}</pre></body></html>"
    manifest = _scorm_manifest(title, "assessment/index.html")
    scorm_bytes = _zip_bytes({"imsmanifest.xml": manifest, "assessment/index.html": html})
    save_bytes_file(scorm_name, scorm_bytes)

    return [
        PackageArtifact(label="H5P Question Set", kind="h5p", filename=h5p_name, download_url=asset_url(h5p_name)),
        PackageArtifact(label="SCORM 1.2 Assessment", kind="scorm", filename=scorm_name, download_url=asset_url(scorm_name)),
    ]


def build_multimedia_packages(title: str, multimedia: MultimediaResponse) -> list[PackageArtifact]:
    slug = slugify(title)
    h5p_name = f"{slug}-interactive-video.h5p"
    transcript_name = f"{slug}-transcript.vtt"
    save_bytes_file(transcript_name, multimedia.vtt_text.encode("utf-8"))

    h5p_content = {
        "title": title,
        "library": "H5P.InteractiveVideo 1.27",
        "chapters": [chapter.model_dump() for chapter in multimedia.chapters],
        "knowledgeChecks": [item.model_dump() for item in multimedia.knowledge_checks],
    }
    h5p_bytes = _zip_bytes(
        {
            "h5p.json": json.dumps({"title": title, "language": "en", "mainLibrary": "H5P.InteractiveVideo"}, indent=2),
            "content/content.json": json.dumps(h5p_content, indent=2),
            "content/transcript.vtt": multimedia.vtt_text,
        }
    )
    save_bytes_file(h5p_name, h5p_bytes)
    return [
        PackageArtifact(label="Interactive Video H5P", kind="h5p", filename=h5p_name, download_url=asset_url(h5p_name)),
        PackageArtifact(label="Transcript VTT", kind="vtt", filename=transcript_name, download_url=asset_url(transcript_name)),
    ]


def build_lesson_packages(
    title: str,
    preview_html: str,
    branding: BrandingConfig,
    chapters: list[ChapterMarker],
    xapi_events: list[dict],
) -> list[PackageArtifact]:
    slug = slugify(title)
    html_name = f"{slug}-lesson-html.zip"
    h5p_name = f"{slug}-course-presentation.h5p"
    scorm_name = f"{slug}-lesson-scorm.zip"
    xapi_name = f"{slug}-xapi.json"

    presentation = {
        "title": title,
        "branding": branding.model_dump(),
        "chapters": [chapter.model_dump() for chapter in chapters],
    }
    html_bytes = _zip_bytes({"index.html": preview_html})
    save_bytes_file(html_name, html_bytes)

    h5p_bytes = _zip_bytes(
        {
            "h5p.json": json.dumps({"title": title, "language": "en", "mainLibrary": "H5P.CoursePresentation"}, indent=2),
            "content/content.json": json.dumps(presentation, indent=2),
            "content/index.html": preview_html,
        }
    )
    save_bytes_file(h5p_name, h5p_bytes)

    scorm_bytes = _zip_bytes(
        {
            "imsmanifest.xml": _scorm_manifest(title, "lesson/index.html"),
            "lesson/index.html": preview_html,
        }
    )
    save_bytes_file(scorm_name, scorm_bytes)
    save_bytes_file(xapi_name, json.dumps(xapi_events, indent=2).encode("utf-8"))

    return [
        PackageArtifact(label="HTML5 Lesson Deck", kind="html5", filename=html_name, download_url=asset_url(html_name)),
        PackageArtifact(label="H5P Course Presentation", kind="h5p", filename=h5p_name, download_url=asset_url(h5p_name)),
        PackageArtifact(label="SCORM 1.2 Lesson", kind="scorm", filename=scorm_name, download_url=asset_url(scorm_name)),
        PackageArtifact(label="xAPI Statement Log", kind="xapi", filename=xapi_name, download_url=asset_url(xapi_name)),
    ]


def slugify(value: str) -> str:
    return "-".join(part for part in "".join(ch.lower() if ch.isalnum() else "-" for ch in value).split("-") if part)


def _scorm_manifest(title: str, resource_href: str) -> str:
    return dedent(
        f"""\
        <?xml version="1.0" encoding="UTF-8"?>
        <manifest identifier="shiksha-demo" version="1.0">
          <organizations default="ORG1">
            <organization identifier="ORG1">
              <title>{title}</title>
              <item identifier="ITEM1" identifierref="RES1">
                <title>{title}</title>
              </item>
            </organization>
          </organizations>
          <resources>
            <resource identifier="RES1" type="webcontent" href="{resource_href}">
              <file href="{resource_href}" />
            </resource>
          </resources>
        </manifest>
        """
    )
