import React, { useEffect } from 'react';

type Props = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

const DEFAULT_TITLE_SUFFIX = 'Nexus Ventures';

const PageMeta: React.FC<Props> = ({ title, description, children }) => {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | ${DEFAULT_TITLE_SUFFIX}`;
    } else {
      document.title = DEFAULT_TITLE_SUFFIX;
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    return () => {
      // leave the title/description for the next route to set; no need to restore prevTitle
      // (restoring can cause flash when navigating to another page that sets its own title)
    };
  }, [title, description]);

  return <>{children}</>;
};

export default PageMeta;
