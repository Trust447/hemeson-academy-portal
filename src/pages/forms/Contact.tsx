import SchoolForm from "@/components/forms/SchoolForm";

export default function ContactPage() {
  return (
    <div className="container py-10">
      
      
      <SchoolForm 
        type="contact" 
        title="Contact Us" 
        description="Have a general question? Drop us a message and we'll get back to you within 24 hours."
      />
    </div>
  );
}