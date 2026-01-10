import { useState } from "react";
// Fixed imports to use relative paths and included CardDescription
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { Link } from "react-router-dom";

interface SchoolFormProps {
  title: string;
  description: string;
  type: "inquiry" | "contact";
}

export default function SchoolForm({ title, description, type }: SchoolFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // FORMSPREE ID from environment variables
  const FORMSPREE_ID = (import.meta as any).env.VITE_FORMSPREE_ID;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Add subject line to the email
    formData.append("_subject", `New ${type === "inquiry" ? "Admission Inquiry" : "Contact Message"} from Website`);

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Message Sent!",
          description: "The school office has received your inquiry."
        });
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Could not send message. Please check your internet and try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full  mx-auto flex flex-col items-center bg-slate-50 p-4  max-w-lg shadow-lg border-t-8 border-t-blue-600">
      
      {/* Centered Logo Section */}
      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border shadow-sm">
        <Link to="/" className="group">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border shadow-sm">
            <img 
              src="/hemeson-logo.png" 
              alt="Hemeson Academy Logo" 
              className="w-16 h-16 object-contain" 
            />
          </div>
        </Link>
      </div>

      {/* Centered Header Text */}
      <CardHeader className="text-center w-full px-6">
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-base mt-2">{description}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="w-full">
        <CardContent className="space-y-4 px-6 pb-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="First Name" required placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="Last Name" required placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="Phone Number" type="tel" required placeholder="+234..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Your Email (Optional)</Label>
            <Input id="email" name="Email Address" type="email" placeholder="parent@example.com" />
          </div>

          {type === "inquiry" && (
            <div className="space-y-2">
              <Label htmlFor="class">Intended Class for Student</Label>
              <Input id="class" name="Target Class" placeholder="e.g. JSS1, Primary 3" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">How can the school help you?</Label>
            <Textarea
              id="message"
              name="Parent Message"
              required
              placeholder="Type your message here..."
              className="min-h-[120px]"
            />
          </div>

          <Button type="submit" className="w-full font-bold h-12 text-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit to School Office
              </>
            )}
          </Button>

        </CardContent>
      </form>
    </Card>
  );
}