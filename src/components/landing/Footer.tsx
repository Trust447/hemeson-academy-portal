import { Link } from "react-router-dom";
import { GraduationCap, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quickLinks = [
  { name: "About Us", href: "#about" },
  { name: "Programs", href: "#programs" },
  { name: "Admissions", href: "/admissions" },
  // { name: "News & Events", href: "#news" },
];

const portals = [
  { name: "Admin Portal", href: "/admin" },
  { name: "Teacher Portal", href: "/teacher" },
  { name: "Check Results", href: "/results" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* CTA Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold font-display">
                Ready to join the Hemeson family?
              </h3>
              <p className="mt-2 text-slate-400">
                Take the first step towards academic excellence.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="rounded-full px-8">
                <Link to="/admissions">
                Apply Now
                </Link>
              </Button>
              <Button size="lg"  className="rounded-full px-8 text-base shadow-lg bg-secondary hover:bg-sky-dark text-secondary-foreground">
                <Link to="/contact">
                Schedule a Visit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <img src="/hemeson-logo.png" alt="Hemeson Academy Logo" className="w-9 h-10 " />
            </div>
              <span className="font-display text-xl font-bold">
                Hemeson<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Nurturing tomorrow's leaders through innovative learning, 
              character development, and academic excellence since 2016.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-semibold mb-6">Portals</h4>
            <ul className="space-y-3">
              {portals.map((portal) => (
                <li key={portal.name}>
                  <Link 
                    to={portal.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {portal.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Hemeson House, Ukaegbu, Umuejije, Osisioma L.G.A, Aba, Abia State, Nigeria</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>+234 (0) 803 898 2154</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <span>info@hemesonacademy.ng</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2025 Hemeson Academy. All rights reserved.</p>
            <div className="flex gap-6">
              <p>Powered by TRUSTED IDEAS </p>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}