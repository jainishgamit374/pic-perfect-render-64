# Architecture
- Report customization lives on each inspection record; this keeps previews and PDF exports consistent across devices.
- Report renderers share a report-data adapter; this keeps the four document identities independent of the editing interface.
- The attached design system owns application colors and control skins; app CSS only composes its tokens and components.