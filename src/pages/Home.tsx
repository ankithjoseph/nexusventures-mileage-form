import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, Globe, Link as LinkIcon, Building, Users, Target } from "lucide-react";
import nexusLogo from "@/assets/nexus-ventures-logo.png";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <img
            src={nexusLogo}
            alt="Nexus Ventures Logo"
            className="h-24 w-auto mx-auto mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            Nexus Ventures
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional business solutions and compliance tools for Ireland.
            Streamlining your administrative processes with modern technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/mileage-book">
                <FileText className="w-5 h-5 mr-2" />
                Business Mileage Logbook
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/expense-report">
                <Receipt className="w-5 h-5 mr-2" />
                Expense Report
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">Our Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive business compliance and administrative solutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Business Mileage Tracking</CardTitle>
              <CardDescription>
                Professional mileage logbook for tax compliance in Ireland
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/mileage-book">Access Mileage Book</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Receipt className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Expense Management</CardTitle>
              <CardDescription>
                Streamlined expense reporting and reimbursement process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/expense-report">Access Expense Report</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Building className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Business Compliance</CardTitle>
              <CardDescription>
                Ensuring your business meets all regulatory requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="https://www.nexusventures.eu" target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary mb-6">About Nexus Ventures</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Nexus Ventures is dedicated to providing professional business solutions
              that help companies streamline their administrative processes and ensure
              compliance with Irish tax regulations.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Our Mission</h3>
                <p className="text-sm text-muted-foreground">
                  To simplify business compliance through innovative technology solutions
                </p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Our Team</h3>
                <p className="text-sm text-muted-foreground">
                  Experienced professionals committed to your business success
                </p>
              </div>
              <div className="text-center">
                <Building className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Our Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Ireland-based solutions for Irish business compliance
                </p>
              </div>
            </div>
          </div>
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
              <p>Professional Business Solutions – Ireland</p>
              <p className="mt-1">Tax Year 2024 Compliance Tools</p>
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