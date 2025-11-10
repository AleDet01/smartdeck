import { memo } from 'react';

const PageBackground = memo(() => (
  <div className="page-bg-wrapper" aria-hidden="true">
    <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" loading="lazy" />
  </div>
));

PageBackground.displayName = 'PageBackground';

export default PageBackground;
