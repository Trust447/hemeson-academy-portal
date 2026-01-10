import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, User, Mail, MapPin, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ----------------- Types -----------------
interface Class {
  id: string;
  level: string;
  section?: string;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  admission_number: string;
  guardian_number?: string | null;
  created_at: string;
  class?: Class;
}

// ----------------- Component -----------------
export default function StudentIDCard() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ----------------- Fetch Student -----------------
  const { data: student, isLoading } = useQuery<Student | null>({
    queryKey: ["student-id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          first_name,
          middle_name,
          last_name,
          admission_number,
          guardian_number,
          created_at,
          class:classes(id, level, created_at)
        `)
        .eq("id", id)
        .maybeSingle<Student>();

      if (error) {
        console.error("Supabase error:", error.message);
        return null;
      }

      return data;
    },
    enabled: !!id,
  });

  // ----------------- Expiry Calculation -----------------
  const levelsOrder = [
    "Basic 1",
    "Basic 2",
    "Basic 3",
    "Basic 4",
    "Basic 5",
    "JSS 1",
    "JSS 2",
    "JSS 3",
    "SSS 1",
    "SSS 2",
    "SSS 3",
  ];

  const calculateExpiry = (): string => {
    if (!student?.class?.level) return "N/A";

    const currentLevel = student.class.level;
    const startYear = new Date(student.created_at).getFullYear();
    const currentIndex = levelsOrder.findIndex(
      (lvl) => lvl.toLowerCase() === currentLevel.toLowerCase()
    );

    if (currentIndex === -1) return "N/A";

    const remainingLevels = levelsOrder.length - 1 - currentIndex;
    if (remainingLevels <= 0) return "N/A";

    return `JULY ${startYear + remainingLevels}`;
  };

  // ----------------- Download PDF -----------------
  const handleDownload = async () => {
    const element = document.getElementById("id-card-front-only");
    if (!element || !student) return;

    const canvas = await html2canvas(element, { scale: 4, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", [101.6, 63.5]);
    pdf.addImage(imgData, "PNG", 0, 0, 101.6, 63.5);
    pdf.save(`${student.admission_number}_ID_CARD.pdf`);
  };

  if (isLoading)
    return <div className="p-10 text-center font-medium">Loading student data...</div>;

  if (!student)
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        Failed to load student data.
      </div>
    );

  // ----------------- Render -----------------
  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="w-full max-w-xl flex justify-between items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="hover:bg-blue-800 text-slate-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()} className="bg-white">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-blue-700 hover:bg-blue-800 shadow-md text-white"
          >
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      {/* ID Card */}
      <div
        id="id-card-front-only"
        className="w-[450px] h-[280px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300 flex flex-col relative box-border"
      >
        {/* Header */}
        <div className="bg-blue-900 h-[60px] px-6 flex items-center gap-4 text-white border-b-[4px] border-yellow-500 shrink-0">
          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0">
            <img src="/hemeson-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-[20px] font-black tracking-tight leading-none truncate">
              HEMESON ACADEMY
            </h2>
            <p className="text-[9px] uppercase tracking-[0.3em] text-yellow-400 font-bold mt-1">
              Striving for Excellence
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex p-6 gap-6 bg-white relative overflow-hidden items-center">
          <img
            src="/hemeson-logo.png"
            className="absolute right-[-20px] w-48 h-48 opacity-[0.06] grayscale -z-0 pointer-events-none"
            alt=""
          />

          {/* Student Photo */}
          <div className="relative z-10 flex flex-col items-center gap-3 shrink-0">
            <div className="w-[120px] h-[140px] bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
              <User className="h-20 w-20 text-slate-200" />
            </div>
          </div>

          {/* Student Info */}
          <div className="flex-1 z-10 flex flex-col justify-center overflow-hidden">
            <h3 className="text-blue-900 font-black text-[15px] leading-tight uppercase mb-2 mt-2 truncate">
              {student.first_name} <br />
              <span className="text-slate-700">
                {student.middle_name ? `${student.middle_name} ` : ""}
                {student.last_name}
              </span>
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  Reg Number
                </span>
                <span className="text-[14px] font-mono font-black text-blue-900">
                  {student.admission_number}
                </span>
              </div>

              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Class
                  </span>
                  <span className="text-[13px] font-bold text-slate-800">
                    {student.class?.level || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Expiry
                  </span>
                  <span className="text-[13px] font-bold text-red-600 uppercase italic">
                    {calculateExpiry()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col pt-2 border-t border-slate-100">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  Guardian
                </span>
                <span className="text-[13px] font-bold text-slate-800">
                  {student.guardian_number ?? "0800-HEMESON"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 h-[40px] border-t border-slate-200 px-6 flex justify-between items-center shrink-0">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[9px] text-slate-600 font-black">
              <MapPin className="h-3.5 w-3.5 text-blue-900" />
              Ukaegbu Umuejije Mbutuoma, Osisioma Ngwa L.G.A., Aba, Abia State
            </div>
            <div className="flex items-center gap-2 text-[9px] text-slate-600 font-black mt-1">
              <Mail className="h-3.5 w-3.5 text-blue-900" />
              INFO@HEMESONACADEMY.COM
            </div>
          </div>
          <ShieldCheck className="h-8 w-8 text-blue-900 opacity-20" />
        </div>
      </div>

      <div className="mt-8 text-center space-y-1">
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
          Official Hemeson Academy Identity
        </p>
      </div>
    </div>
  );
}
