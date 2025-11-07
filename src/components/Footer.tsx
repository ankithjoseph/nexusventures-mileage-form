import React from 'react';
import nexusLogo from '@/assets/nexus-ventures-logo.png';
import { Globe, Link as LinkIcon } from 'lucide-react';

interface FooterProps {
  title: string;
  subtitle?: string;
}

const Footer: React.FC<FooterProps> = ({ title, subtitle }) => {
  return (
    <footer className="bg-card border-t mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src={nexusLogo}
              alt="Nexus Ventures"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="text-center">
            <p>{title}</p>
            {subtitle ? <p className="mt-1">{subtitle}</p> : null}
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
  );
};

export default Footer;
