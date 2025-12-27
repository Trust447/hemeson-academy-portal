import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentUploader } from "@/components/admin/StudentUploader";
import { mockStudents, mockClasses, getClassName } from "@/lib/mockData";

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = classFilter === "all" || student.class_id === classFilter;
    
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Students</h1>
        <p className="text-muted-foreground mt-1">
          Manage student records and bulk uploads
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Student List</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>
                View and manage all enrolled students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or admission number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {mockClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.level} {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-sm">
                          {student.admission_number}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.first_name} {student.middle_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.gender || '-'}</TableCell>
                        <TableCell>
                          {student.class_id ? getClassName(student.class_id) : '-'}
                        </TableCell>
                        <TableCell>
                          {student.is_active ? (
                            <Badge className="bg-success/10 text-success border-success/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No students found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Showing {filteredStudents.length} of {mockStudents.length} students
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <StudentUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
