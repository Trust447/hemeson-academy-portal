import SchoolForm from "@/components/forms/SchoolForm";

export default function AdmissionPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <SchoolForm 
        type="inquiry" 
        title="Admission Inquiry" 
        description="Start your child's journey with Hemeson Academy. Fill out the form below to begin the process."
      />
    </div>
  );
}