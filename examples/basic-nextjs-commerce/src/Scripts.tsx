'use client';
import { JSX, useEffect, useState } from 'react';
import { EditingScripts } from '@sitecore-content-sdk/nextjs';
import CdpPageView from 'components/content-sdk/CdpPageView';

const EDITING_SCRIPTS_FLAG = '__scEditingScriptsInitialized__';

type WindowWithEditingFlag = Window & {
  [EDITING_SCRIPTS_FLAG]?: boolean;
};

const Scripts = (): JSX.Element => {
  const [shouldRenderEditingScripts, setShouldRenderEditingScripts] = useState(false);

  useEffect(() => {
    const isEmbeddedInIframe = window.self !== window.top;
    if (!isEmbeddedInIframe) {
      setShouldRenderEditingScripts(false);
      return;
    }

    const browserWindow = window as WindowWithEditingFlag;

    if (browserWindow[EDITING_SCRIPTS_FLAG]) {
      setShouldRenderEditingScripts(false);
      return;
    }

    browserWindow[EDITING_SCRIPTS_FLAG] = true;
    setShouldRenderEditingScripts(true);
  }, []);

  return (
    <>
      <CdpPageView />
      {shouldRenderEditingScripts ? <EditingScripts /> : null}
    </>
  );
};

export default Scripts;