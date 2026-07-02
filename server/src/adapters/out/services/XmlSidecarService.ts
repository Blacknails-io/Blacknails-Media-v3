import path from 'path';
import { promises as fs } from 'fs';
import { ISidecarService } from '../../../application/ports/out/ISidecarService.js';
import { Asset } from '../../../domain/entities/Asset.js';

export class XmlSidecarService implements ISidecarService {
  constructor(private readonly sidecarDir: string) {}

  public async write(asset: Asset): Promise<string | undefined> {
    if (!asset.aiDescription && (!asset.tags || asset.tags.length === 0) && !asset.title) {
      return undefined;
    }

    const shard = asset.id.slice(0, 2);
    const dir = path.join(this.sidecarDir, shard);
    await fs.mkdir(dir, { recursive: true });

    const targetPath = path.join(dir, `${asset.id}.xmp`);
    const tags = (asset.tags || []).map((tag) => `<rdf:li>${this.escape(tag)}</rdf:li>`).join('');
    const xml = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${this.escape(asset.title || '')}</rdf:li></rdf:Alt></dc:title>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${this.escape(asset.aiDescription || '')}</rdf:li></rdf:Alt></dc:description>
      <dc:subject><rdf:Bag>${tags}</rdf:Bag></dc:subject>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    await fs.writeFile(targetPath, xml, 'utf8');
    return targetPath;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
