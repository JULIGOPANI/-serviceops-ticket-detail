import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { BomProduct } from './bomData';

/* Add / edit one scan scope on a host. Opened from the Manage scan paths drawer, and stacked on
 * top of it — the two form one flow, so this sits at a higher z-index rather than replacing it. */

export interface ProductFormValue {
  key: string;
  name: string;
  version: string;
  path: string;
  excludePaths: string[];
  isDefault: boolean;
}

interface BomProductFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Product being edited, or null when adding a new one. */
  editing: BomProduct | null;
  onSave: (v: ProductFormValue) => void;
}

export function BomProductFormPanel({ isOpen, onClose, editing, onSave }: BomProductFormPanelProps) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [path, setPath] = useState('');
  const [excludes, setExcludes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [touched, setTouched] = useState(false);

  // Seed from the product being edited each time the form opens.
  useEffect(() => {
    if (!isOpen) return;
    setName(editing?.name ?? '');
    setVersion(editing?.version ?? '');
    setPath(editing?.path ?? '');
    setExcludes((editing?.excludePaths ?? []).join(', '));
    setIsDefault(!!editing?.isDefault);
    setTouched(false);
  }, [isOpen, editing]);

  if (!isOpen) return null;

  const nameError = touched && !name.trim();
  const pathError = touched && !path.trim();
  const valid = !!name.trim() && !!path.trim();

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    onSave({
      key: editing?.key ?? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: name.trim(),
      version: version.trim(),
      path: path.trim(),
      excludePaths: excludes.split(',').map((s) => s.trim()).filter(Boolean),
      isDefault,
    });
  };

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="mb-1.5 block text-[13px] font-medium text-[#364658]">
      {children}{required && <span className="ml-0.5 text-[#DC2626]">*</span>}
    </label>
  );
  const field = (err: boolean) =>
    `h-9 w-full rounded border bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 ${
      err ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#d1d5db] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]'
    }`;

  return (
    // Sits above the Manage scan paths drawer (z-[10000] vs its z-[9999]).
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[560px] max-w-[95vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <h3 className="text-[16px] font-semibold text-[#364658]">{editing ? 'Edit product' : 'Add product'}</h3>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-4">
            <Label required>Product name</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payments Web"
              className={field(nameError)}
            />
            {nameError && <p className="mt-1 text-[12px] text-[#DC2626]">Product name is required.</p>}
          </div>

          <div className="mb-4">
            <Label>Version</Label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Version"
              className={field(false)}
            />
          </div>

          <div className="mb-4">
            <Label required>Path</Label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g. C:\Program Files\Payments   or   /opt/payments"
              className={`${field(pathError)} font-mono placeholder:font-mono`}
            />
            {pathError && <p className="mt-1 text-[12px] text-[#DC2626]">Path is required — it is what the scan walks.</p>}
          </div>

          <div className="mb-5">
            <Label>Exclude paths — this product only</Label>
            <input
              type="text"
              value={excludes}
              onChange={(e) => setExcludes(e.target.value)}
              placeholder="Exclude here (optional, comma-sep)"
              className={`${field(false)} font-mono placeholder:font-mono`}
            />
            <p className="mt-1.5 text-[12px] text-[#7B8FA5]">
              Scoped to this product — these globs are skipped only under the path above.
            </p>
          </div>

          {/* Default scope — the one the BOM tab lands on */}
          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] p-3.5">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">Make this the default product</span>
                <span className="mt-0.5 block text-[12px] text-[#7B8FA5]">
                  Its SBOM versions are the ones shown when the BOM tab opens. Only one product can be
                  the default — setting this moves it off the current one.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#DFE5ED] px-5 py-3">
          <button onClick={onClose} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">
            Cancel
          </button>
          <button
            onClick={submit}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3479b5]"
          >
            <Check size={15} /> {editing ? 'Update product' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}
