import { useResumeStore } from '../../store/resumeStore';
import { FormField } from './FormField';
import { RepeatableSection } from './RepeatableSection';

export function BasicsForm() {
  const basics = useResumeStore((s) => s.resume.basics) || {};
  const updateBasics = useResumeStore((s) => s.updateBasics);
  const updateBasicsLocation = useResumeStore((s) => s.updateBasicsLocation);
  const profiles = basics.profiles || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Full Name"
          value={basics.name || ''}
          onChange={(v) => updateBasics('name', v)}
          placeholder="John Doe"
        />
        <FormField
          label="Job Title"
          value={basics.label || ''}
          onChange={(v) => updateBasics('label', v)}
          placeholder="Web Developer"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Email"
          value={basics.email || ''}
          onChange={(v) => updateBasics('email', v)}
          type="email"
          placeholder="john@example.com"
        />
        <FormField
          label="Phone"
          value={basics.phone || ''}
          onChange={(v) => updateBasics('phone', v)}
          type="tel"
          placeholder="+1 234 567 890"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Website"
          value={basics.url || ''}
          onChange={(v) => updateBasics('url', v)}
          placeholder="https://example.com"
        />
        <FormField
          label="Image URL"
          value={basics.image || ''}
          onChange={(v) => updateBasics('image', v)}
          placeholder="https://example.com/photo.jpg"
        />
      </div>
      <FormField
        label="Summary"
        value={basics.summary || ''}
        onChange={(v) => updateBasics('summary', v)}
        multiline
        placeholder="A short bio about yourself"
      />

      <h3 className="text-sm font-semibold text-gray-700 pt-2">Location</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="City"
          value={basics.location?.city || ''}
          onChange={(v) => updateBasicsLocation('city', v)}
          placeholder="San Francisco"
        />
        <FormField
          label="Region"
          value={basics.location?.region || ''}
          onChange={(v) => updateBasicsLocation('region', v)}
          placeholder="California"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Country Code"
          value={basics.location?.countryCode || ''}
          onChange={(v) => updateBasicsLocation('countryCode', v)}
          placeholder="US"
        />
        <FormField
          label="Postal Code"
          value={basics.location?.postalCode || ''}
          onChange={(v) => updateBasicsLocation('postalCode', v)}
          placeholder="94107"
        />
      </div>

      <RepeatableSection
        title="Profiles"
        items={profiles}
        onChange={(items) => updateBasics('profiles', items)}
        defaultItem={{ network: '', username: '', url: '' }}
        renderItem={(item, index, update) => (
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="Network"
              value={item.network || ''}
              onChange={(v) => update(index, { ...item, network: v })}
              placeholder="LinkedIn"
            />
            <FormField
              label="Username"
              value={item.username || ''}
              onChange={(v) => update(index, { ...item, username: v })}
              placeholder="johndoe"
            />
            <FormField
              label="URL"
              value={item.url || ''}
              onChange={(v) => update(index, { ...item, url: v })}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
        )}
      />
    </div>
  );
}
