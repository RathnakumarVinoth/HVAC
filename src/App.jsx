import { useRef, useState } from 'react';
import { submitServiceRequest } from './services/serviceRequests';

const services = ['AC Repair', 'AC Installation', 'Heating Repair', 'Maintenance', 'Other'];
const timeSlots = ['Morning · 8 AM – 12 PM', 'Afternoon · 12 PM – 4 PM', 'Evening · 4 PM – 7 PM', 'No preference'];
const initialValues = { fullName: '', phone: '', email: '', zip: '', service: '', description: '', date: '', time: '' };

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function validate(values) {
  const errors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.';
  const digits = values.phone.replace(/\D/g, '');
  if (!/^\+?[\d\s().-]+$/.test(values.phone.trim()) || !(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) errors.phone = 'Enter a valid 10-digit US phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!/^\d{5}$/.test(values.zip.trim())) errors.zip = 'Enter a 5-digit ZIP code.';
  if (!services.includes(values.service)) errors.service = 'Please select a service.';
  if (values.description.trim().length < 10) errors.description = 'Please describe the problem in at least 10 characters.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || values.date < localDate()) errors.date = 'Choose today or a future date.';
  if (!timeSlots.includes(values.time)) errors.time = 'Please select a preferred time.';
  return errors;
}

function Icon({ name = 'snow', size = 24, ...props }) {
  const paths = {
    snow: <><path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    heat: <path d="M12 2c1 6 7 7 7 13a7 7 0 0 1-14 0c0-3 2-5 3-7 0 4 2 4 2 4s4-5 2-10Z" />,
    tool: <path d="M14 6a5 5 0 0 0-6 6l-5 5a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-4-4 3-3Z" />,
    unit: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M6 12h12M8 19v2m4-2v3m4-3v2M17 8h1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function Brand() {
  return <a className="brand" href="#" aria-label="CoolAir HVAC home"><span className="brand-icon"><Icon size={28} /></span><span>CoolAir<span className="brand-small">HVAC</span></span></a>;
}

function RequestForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const formRef = useRef(null);
  const successRef = useRef(null);

  function update(event) {
    const { name, value } = event.target;
    setValues(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined, submit: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'submitting') return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      formRef.current.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setStatus('submitting');
    try {
      const request = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
      const response = await submitServiceRequest(request);
      if (!response?.ok) {
        throw new Error('Service request did not return a successful HTTP response.');
      }
      setSubmittedRequest(request);
      setValues(initialValues);
      setStatus('success');
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (error) {
      console.error('CoolAir HVAC service request failed:', error);
      setSubmittedRequest(null);
      setStatus('idle');
      setErrors({ submit: "We couldn't submit your request. Please try again." });
    }
  }

  function field(name, label, options = {}) {
    const { type = 'text', placeholder, autoComplete, choices, full = false } = options;
    const shared = { id: name, name, value: values[name], onChange: update, required: true, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined };
    return <div className={`field ${full ? 'full' : ''}`}>
      <label htmlFor={name}>{label}<span aria-hidden="true"> *</span></label>
      {choices ? <select {...shared}><option value="">{placeholder}</option>{choices.map(choice => <option key={choice}>{choice}</option>)}</select>
        : type === 'textarea' ? <textarea {...shared} placeholder={placeholder} rows={3} maxLength={2000} />
        : <input {...shared} type={type} placeholder={placeholder} autoComplete={autoComplete} min={type === 'date' ? localDate() : undefined} maxLength={name === 'zip' ? 5 : name === 'fullName' ? 100 : undefined} inputMode={name === 'zip' ? 'numeric' : undefined} />}
      {errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name]}</span>}
    </div>;
  }

  return <section className="request-card" id="request-service" aria-labelledby="form-title">
    {status === 'success' ? <div className="success" ref={successRef} tabIndex={-1} role="status">
      <span className="success-icon"><Icon name="check" size={34} /></span>
      <p className="eyebrow">YOU’RE ALL SET</p>
      <h2 id="form-title">Thanks, {submittedRequest.fullName.split(/\s+/)[0]}!</h2>
      <p>Thanks! Your service request has been received.</p>
      <div className="success-details"><strong>{submittedRequest.service}</strong><span>{new Date(`${submittedRequest.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span><span>{submittedRequest.time}</span></div>
      <p className="demo-note">Your preferred appointment date and time are subject to confirmation.</p>
      <button className="primary-button" onClick={() => { setSubmittedRequest(null); setStatus('idle'); setErrors({}); requestAnimationFrame(() => formRef.current?.elements.namedItem('fullName')?.focus()); }}>Start a new request <Icon name="arrow" size={18} /></button>
    </div> : <>
      <div className="form-heading"><span className="eyebrow">LET’S GET YOU COMFORTABLE</span><h2 id="form-title">Request a service</h2><p>Tell us what’s going on. We’ll take it from here.</p></div>
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {field('fullName', 'Full Name', { placeholder: 'John Smith', autoComplete: 'name', full: true })}
          {field('phone', 'Phone Number', { type: 'tel', placeholder: '(214) 555-0123', autoComplete: 'tel' })}
          {field('email', 'Email', { type: 'email', placeholder: 'you@example.com', autoComplete: 'email' })}
          {field('zip', 'ZIP Code', { placeholder: '75201', autoComplete: 'postal-code' })}
          {field('service', 'Service Needed', { choices: services, placeholder: 'Select a service' })}
          {field('description', 'Problem Description', { type: 'textarea', placeholder: 'For example: My AC is running but isn’t cooling the house.', full: true })}
          {field('date', 'Preferred Appointment Date', { type: 'date' })}
          {field('time', 'Preferred Time', { choices: timeSlots, placeholder: 'Select a time' })}
        </div>
        <p className="form-hint">All fields are required. Appointment preferences are subject to availability.</p>
        {errors.submit && <p className="field-error" role="alert">{errors.submit}</p>}
        <button className="primary-button" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Submitting...' : 'Request Service'}<Icon name="arrow" size={19} /></button>
        <p className="privacy-note"><Icon name="shield" size={14} /> Your details are sent to process your service request.</p>
      </form>
    </>}
  </section>;
}

const serviceCards = [
  { icon: 'snow', title: 'AC Repair', text: 'Warm air? Strange noises? Let’s get your cool back.' },
  { icon: 'unit', title: 'AC Installation', text: 'A fresh start with efficient cooling that fits your home.' },
  { icon: 'heat', title: 'Heating Repair', text: 'Keep the chill outside and the comfort inside.' },
  { icon: 'tool', title: 'Maintenance', text: 'A little upkeep today. Fewer surprises tomorrow.' },
];

export default function App() {
  return <>
    <div className="announcement"><Icon name="pin" size={14} /> Your neighborhood comfort team in Dallas, Texas <span className="announcement-tag">LOCAL CARE. YEAR-ROUND COMFORT.</span></div>
    <header className="header container"><Brand /><nav aria-label="Main navigation"><a href="#services">Our services</a><a href="#why-coolair">Why CoolAir</a><a className="nav-button" href="#request-service">Request service <Icon name="arrow" size={16} /></a></nav></header>
    <main>
      <section className="hero"><div className="hero-orbit" aria-hidden="true" /><div className="container hero-grid">
        <div className="hero-content"><div className="location-pill"><span /> DALLAS, TX & SURROUNDING AREAS</div><h1>Fast HVAC Service <br />When You<br /><span>Need It</span><span className="period">.</span></h1><p className="hero-description">From AC repair and installation to heating repair and routine maintenance, we keep your home comfortable through every Texas season.</p>
          <div className="hero-promises"><span><Icon name="check" size={17} /> Clear communication</span><span><Icon name="check" size={17} /> Comfort-first service</span></div>
          <div className="comfort-art" aria-hidden="true"><div className="art-lines" /><div className="house"><div className="roof" /><div className="house-body"><div className="window" /><div className="door" /></div></div><div className="outdoor-unit"><div className="fan"><Icon name="snow" size={46} /></div><div className="vents" /></div><div className="temp-badge"><Icon name="snow" size={18} /><span>Perfectly comfortable.<small>Whatever Texas has planned.</small></span></div><span className="art-caption">A LITTLE COOL. A LOT OF COMFORT.</span></div>
          <div className="hero-bottom"><span className="mini-icon"><Icon name="pin" size={20} /></span><p>Big-city expertise. Neighborhood care.<small>Proudly imagined for Dallas homeowners.</small></p></div>
        </div>
        <RequestForm />
      </div></section>
      <section className="trust-strip" id="why-coolair"><div className="container trust-grid"><div><Icon name="clock" /><span><strong>Service that fits your day</strong><small>Tell us your preferred date and time</small></span></div><div><Icon name="shield" /><span><strong>Clarity from the start</strong><small>Straightforward, helpful communication</small></span></div><div><Icon name="pin" /><span><strong>Dallas is home</strong><small>Comfort for every Texas season</small></span></div></div></section>
      <section className="services container" id="services"><div className="section-heading"><div><p className="eyebrow">YOUR HOME. OUR FOCUS.</p><h2>Comfort, covered.</h2></div><p>One local team for your home’s<br className="desktop-break" /> heating and cooling needs.</p></div><div className="service-grid">{serviceCards.map(service => <a className="service-card" href="#request-service" key={service.title}><span className="service-icon"><Icon name={service.icon} size={25} /></span><h3>{service.title}</h3><p>{service.text}</p><span className="service-link">Request service <Icon name="arrow" size={17} /></span></a>)}</div></section>
    </main>
    <footer className="container footer"><Brand /><p>© {new Date().getFullYear()} CoolAir HVAC. Fictional company · Demo website.</p><span>Made for a more comfortable home.</span></footer>
  </>;
}
