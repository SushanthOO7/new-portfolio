import ContactForm from './ContactForm.jsx';

const meta={title:'Islands/Contact Form',component:ContactForm,parameters:{layout:'centered'}};
export default meta;

export const Default={render:()=> <div style={{width:'min(90vw, 640px)'}}><ContactForm /></div>};
