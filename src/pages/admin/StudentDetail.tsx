import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Calendar, GraduationCap, Download } from "lucide-react";

export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: student, isLoading, error } = useQuery({
        queryKey: ["student", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("students")
                .select(`*, classes(level)`)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    if (isLoading) return <div className="p-10 text-center">Loading Profile...</div>;
    if (error || !student) return <div className="p-10 text-center text-red-500">Student not found.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>

            <div className="flex items-center gap-4 border-b pb-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{student.first_name} {student.last_name}</h1>
                    <p className="text-muted-foreground uppercase tracking-widest text-sm font-mono">
                        ID: {student.admission_number}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-blue-500" />
                            Academic Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Class Level:</span>
                            <span className="font-semibold text-blue-700">{student.classes?.level || "Unassigned"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Enrollment Date:</span>
                            {/* Changed from registration_date to created_at */}
                            <span className="font-medium">{new Date(student.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="capitalize">{student.gender || "Not specified"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Guardian Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Phone className="h-5 w-5 text-green-500" />
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Guardian Phone:</span>
                            {/* If guardian_number is missing, we use a fallback or an empty string */}
                            <span className="font-medium">{(student as any).guardian_number || "No contact provided"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Birth Date:</span>
                            <span className="font-medium">{student.date_of_birth || "N/A"}</span>
                        </div>
                    </CardContent>
                </Card>
                <Button
                    onClick={() => navigate(`/admin/students/${student.id}/id-card`)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Download className="mr-2 h-4 w-4" /> Download ID Card
                </Button>
            </div>
        </div>
    );
}