import React, { useEffect } from 'react';

type ExternalRedirectProps = {
  url: string;
};

const ExternalRedirect: React.FC<ExternalRedirectProps> = ({ url }) => {
  useEffect(() => {
    // use replace so the back button doesn't keep the redirect route in history
    window.location.replace(url);
  }, [url]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Redirecting to <a href={url} className="underline text-primary">{url}</a>...
      </p>
    </div>
  );
};

export default ExternalRedirect;
