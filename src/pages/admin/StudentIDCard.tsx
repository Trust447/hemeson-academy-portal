import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Printer,
  User,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= TYPES ================= */

interface Class {
  id: string;
  level: string;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  admission_number: string;
  created_at: string;
  class: Class | null;
}

/* ================= LEVEL ORDER ================= */

const LEVELS = [
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

export default function StudentIDCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ---------- FETCH ---------- */
  const { data: student, isLoading } = useQuery<Student | null>({
    queryKey: ["student-id", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          first_name,
          middle_name,
          last_name,
          admission_number,
          created_at,
          class:classes (
            id,
            level,
            created_at
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(error);
        return null;
      }

      return data as Student;
    },
  });

  /* ---------- EXPIRY ---------- */
  const calculateExpiry = () => {
    if (!student?.class?.level) return "N/A";

    const index = LEVELS.findIndex(
      (l) => l.toLowerCase() === student.class.level.toLowerCase()
    );

    if (index === -1) return "N/A";

    const startYear = new Date(student.created_at).getFullYear();
    const remaining = LEVELS.length - 1 - index;

    return remaining > 0 ? `JULY ${startYear + remaining}` : "N/A";
  };

  /* ---------- DOWNLOAD ---------- */
  const handleDownload = async () => {
    const el = document.getElementById("id-card");
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", [101.6, 63.5]);
    pdf.addImage(img, "PNG", 0, 0, 101.6, 63.5);
    pdf.save(`${student?.admission_number}_ID_CARD.pdf`);
  };

  if (isLoading) {
    return <div className="p-10 text-center font-bold">Loading…</div>;
  }

  if (!student) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        Student not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl flex justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      {/* ================= CARD ================= */}
      <div
        id="id-card"
        className="relative w-[450px] h-[300px] bg-white rounded-2xl shadow-xl border flex flex-col overflow-hidden"
      >
        {/* Watermark */}
        <img
          src="/hemeson-logo.png"
          className="absolute inset-0 m-auto ml-60 top-20 w-44 opacity-5 pointer-events-none"
          alt=""
        />

        {/* Header */}
        <div className="relative bg-blue-900 px-6 py-3 flex items-center gap-4 text-white border-b-4 border-yellow-500">
          <img
            src="/hemeson-logo.png"
            className="h-10 w-10 bg-white p-1 rounded-lg"
          />
          <div>
            <h2 className="font-black text-sm">HEMESON ACADEMY</h2>
            <p className="text-[9px] uppercase tracking-widest text-yellow-400">
              Striving for Excellence
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex flex-1 p-4 gap-4 items-center">
          <div className="w-[110px] h-[130px] border rounded-xl flex items-center justify-center bg-white">
            <User className="h-16 w-16 text-slate-300" />
          </div>

          <div className="flex-1">
            <h3 className="font-black uppercase text-blue-900 text-base leading-tight">
              {student.first_name}
              <br />
              <span className="text-slate-700">
                {student.middle_name ?? ""} {student.last_name}
              </span>
            </h3>

            <div className="mt-2 space-y-1 text-sm">
              <div>
                <span className="text-[10px] text-slate-400">Reg No</span>
                <div className="font-mono font-bold">
                  {student.admission_number}
                </div>
              </div>

              <div className="flex gap-6">
                <div>
                  <span className="text-[10px] text-slate-400">Class</span>
                  <div className="font-bold">
                    {student.class?.level ?? "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Expiry</span>
                  <div className="font-bold text-red-600">
                    {calculateExpiry()}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400">Address</span>
                <div className="font-bold text-xs">
                  Ukaegbu Umuejije, Mbutuoma, Osisioma L.G.A, Aba, Abia State
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer – guaranteed inside */}
        <div className="mt-auto bg-slate-50 px-4 py-2 flex justify-between items-center text-[10px]">
          <div className="space-y-[2px]">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-blue-900" />
              Aba, Abia State
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-blue-900" />
              info@hemesonacademy.com
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 text-blue-900 opacity-30" />
        </div>
      </div>
    </div>
  );
}
