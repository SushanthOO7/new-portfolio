import { useEffect, useRef, useState } from 'react';
import './contact-form.css';

export default function ContactForm() {
  const [status,setStatus]=useState('idle');const[errors,setErrors]=useState({});const controllerRef=useRef();
  useEffect(()=>()=>controllerRef.current?.abort(),[]);
  async function submit(event){event.preventDefault();controllerRef.current?.abort();const controller=new AbortController();controllerRef.current=controller;setStatus('pending');setErrors({});const data=Object.fromEntries(new FormData(event.currentTarget));try{const response=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:controller.signal});const result=await response.json();if(result.success){setStatus('success')}else{setErrors(result.errors??{form:'Message could not be sent. Please try again.'});setStatus('error')}}catch(error){if(error.name!=='AbortError'){setErrors({form:'Connection lost. Please try again.'});setStatus('error')}}}
  if(status==='success')return <div className="contact-success" role="status"><h2>Message sent</h2><p>Thanks for reaching out. I’ll get back to you soon.</p><a href="/">Back to homepage</a></div>;
  return <form className="contact-form" action="/api/contact" method="post" onSubmit={submit} noValidate={false}>
    <div className="honeypot" aria-hidden="true"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" tabIndex="-1" autoComplete="off" /></div>
    <div className="field"><label htmlFor="contact-email">Your email</label><input id="contact-email" name="email" type="email" autoComplete="email" maxLength="512" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email?'contact-email-error':undefined}/>{errors.email&&<p id="contact-email-error" className="field-error">{errors.email}</p>}</div>
    <div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" rows="7" maxLength="4096" required aria-invalid={Boolean(errors.message)} aria-describedby={errors.message?'contact-message-error':undefined}></textarea>{errors.message&&<p id="contact-message-error" className="field-error">{errors.message}</p>}</div>
    {errors.form&&<p className="form-error" role="alert">{errors.form}</p>}
    <button type="submit" disabled={status==='pending'}>{status==='pending'?'Sending…':'Send message'}</button>
  </form>;
}
