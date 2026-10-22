"""Package shared runtime sources for synchronous, offline HTML export."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent/'dist'
names=['typography.js','poster.js','geometry-engines.js','core.js','bitcoin.js']
sources={name:(root/name).read_text() for name in names}
sources['licenses']='\n\n'.join(p.read_text() for p in sorted((root/'fonts').glob('*-OFL.txt')))
(root/'export-sources.js').write_text('const EXPORT_SOURCES='+json.dumps(sources,ensure_ascii=False)+';\n')
