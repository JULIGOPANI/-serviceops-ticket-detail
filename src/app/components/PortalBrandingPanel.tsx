import { useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { Field, SelectField, Segmented, TextField } from './PortalControls';

/* Branding — what this portal calls itself and who a requester contacts.
 *
 * ⚠️ Only the settings that belong to THIS portal. It used to carry the technician portal's title
 * and help block, the login-screen choice, the setup-guide image and five asset uploaders — org-wide
 * surfaces an admin reaches from Admin › Branding. Showing them here made the builder look like it
 * edited the whole product, and put settings in front of you that nothing on this canvas could ever
 * reflect. The footer note says where those live instead, so the removal reads as a signpost rather
 * than a gap.
 *
 * ⚠️ And the LOGO is not here any more. It is edited by selecting the logo on the page, where its
 * upload sits in the element's own Content section — an image you can see is an image you should be
 * able to click. */

/** A read-only row: the value is a fact about the tenant, not a setting. */
function ReadOnly({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-[12px] text-[#7B8FA5]">{label}</p>
      {/* ⚠️ Shown, not hidden. Which company and which URL this portal answers on is the first thing
          anyone needs to confirm they are editing the right one — and a disabled field says "this is
          decided elsewhere" far better than an absence does. */}
      <div className="flex h-9 w-full items-center rounded border border-[#E5E7EB] bg-[#F7F9FC] px-2.5 text-[13px] text-[#7B8FA5]">
        {value}
      </div>
      <p className="mt-1 text-[11px] leading-[1.5] text-[#9CA3AF]">{hint}</p>
    </div>
  );
}

/** A field whose value falls back to the org-wide setting until this portal overrides it. */
function Inherited({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; hint: string;
}) {
  /* ⚠️ The badge is the whole point of the row. Without it an inherited value and an overridden one
     look identical — you cannot tell whether you are seeing the global default or a decision
     somebody already made here, which is exactly the question this screen has to answer. */
  const own = value.trim().length > 0;
  return (
    <div className="mb-4">
      <p className="mb-1 flex items-center gap-1.5">
        <span className="text-[12px] text-[#7B8FA5]">{label}</span>
        {!own && <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#7B8FA5]">Inherited</span>}
      </p>
      <TextField value={value} onChange={onChange} placeholder={placeholder} />
      <p className="mt-1 text-[11px] leading-[1.5] text-[#9CA3AF]">
        {own ? 'Overridden for this portal.' : 'Using the global default. Type here to override it for this portal only.'}
        {hint ? ` · ${hint}` : ''}
      </p>
    </div>
  );
}

const Head = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 mt-6 border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#364658]">{children}</p>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 flex gap-2 rounded-lg bg-[#F7F9FC] p-3">
    <Info size={14} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
    <p className="text-[12px] leading-[1.55] text-[#7B8FA5]">{children}</p>
  </div>
);

export function PortalBrandingPanel() {
  const [v, setV] = useState<Record<string, string>>({
    name: 'Acme Support',
    title: '',
    landing: 'home',
    idp: 'None — use ServiceOps login',
    email: '',
    phone: '',
  });
  const set = (k: string, x: string) => setV((p) => ({ ...p, [k]: x }));

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <Field label="Portal name">
          <TextField value={v.name} onChange={(x) => set('name', x)} />
        </Field>

        <ReadOnly
          label="Company"
          value="Acme Corporation"
          hint="Enable the multi-company feature to run a separate portal per company."
        />
        <ReadOnly
          label="Portal URL"
          value="https://support.acme.com"
          hint="The default portal keeps a fixed URL — it is where requesters land when nothing else matches."
        />

        <Inherited
          label="Support Portal Title"
          value={v.title}
          onChange={(x) => set('title', x)}
          placeholder="Support Portal"
          hint="Shown on the login page"
        />

        <Field label="Landing Page for Guest Users">
          <Segmented
            value={v.landing}
            onChange={(x) => set('landing', x)}
            options={[{ value: 'home', label: 'Home Page' }, { value: 'login', label: 'Login Page' }]}
          />
        </Field>

        <Head>Sign-on</Head>
        <Field label="Identity Provider" help="Requesters of this portal authenticate against this provider.">
          <SelectField
            value={v.idp}
            onChange={(x) => set('idp', x)}
            options={['None — use ServiceOps login', 'Azure AD', 'Okta', 'Google Workspace', 'SAML 2.0']}
          />
        </Field>
        {/* ⚠️ Stated even while it cannot apply. The SSO-only switch is absent until a provider is
            chosen, and an absent control explains nothing — this says why it is missing and what
            brings it back, which is the difference between a rule and a dead end. */}
        <Note>
          Choose an identity provider before you can enforce SSO-only sign-in. Clearing the provider
          turns this back off, as it does in the product.
        </Note>

        <Head>Contact shown on the portal</Head>
        <Inherited
          label="Support Email"
          value={v.email}
          onChange={(x) => set('email', x)}
          placeholder="servicedesk@acme.com"
          hint=""
        />
        <Inherited
          label="Support Contact No."
          value={v.phone}
          onChange={(x) => set('phone', x)}
          placeholder="+91 79 4040 0000"
          hint=""
        />

        <Note>
          Helpdesk Name, Technician Portal Title and Login Screen Preference apply to the whole
          product and stay in <span className="font-medium text-[#364658]">Organization › Branding</span>.
        </Note>
      </div>

      {/* ⚠️ A STICKY footer, unlike the rest of the builder. Everything else on this canvas applies
          live, but branding reaches every login screen and every other portal — so it takes a
          deliberate Save rather than changing the product under someone who was only looking. */}
      <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#E5E7EB] px-4 py-3">
        <button className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
        <button
          onClick={() => toast.success('Branding saved')}
          className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
        >Save</button>
      </div>
    </div>
  );
}
