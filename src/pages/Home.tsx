import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, Globe, Link as LinkIcon, Calculator } from "lucide-react";
import nexusLogo from "@/assets/nexus-ventures-logo.png";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const { t } = useLanguage();

  const forms = [
    {
      title: "Business Mileage Logbook",
      description: "Track and record your business mileage for tax compliance. Generate professional PDF reports for Ireland tax year 2024.",
      icon: Calculator,
      path: "/mileage-book",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      title: "Business Expense Report",
      description: "Submit and manage your business expenses. Create detailed expense reports with PDF generation.",
      icon: Receipt,
      path: "/expense-report",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Forms Gallery */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">Business Forms</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the form you need to complete your business compliance requirements
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {forms.map((form, index) => {
            const IconComponent = form.icon;
            return (
              <Card key={index} className={`transition-all duration-300 ${form.color} border-2`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm ${form.iconColor}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{form.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {form.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild size="lg" className="w-full">
                    <Link to={form.path}>
                      Access Form
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                src={nexusLogo}
                alt="Nexus Ventures"
                className="h-8 w-auto object-contain"
              />
              <span className="font-semibold">Nexus Ventures</span>
            </div>
            <div className="text-center">
              <p>Ireland Tax Year 2024</p>
              <p className="mt-1">For tax compliance purposes. Keep records for at least 6 years.</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.nexusventures.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                www.nexusventures.eu
              </a>
              <a
                href="https://www.linkedin.com/company/nexus-ventures-limited"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;