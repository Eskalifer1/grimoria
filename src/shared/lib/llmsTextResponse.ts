import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';
import { METADATA_BASE_URL } from '@/constants/env.server';
import { LLMS_SECTIONS } from '@/constants/llms';

/**
 * The `/llms.txt` body — an H1 of the site name, its pitch, then every
 * section as an absolute link — as a `text/plain` response. `/llms-full.txt`
 * serves the same body until public Notes or docs give it more to say.
 */
function llmsTextResponse(): Response {
  const sections = Object.values(LLMS_SECTIONS).map(
    ({ name, route, description }) =>
      `- [${name}](${new URL(route, METADATA_BASE_URL).href}): ${description}`,
  );
  const body = [
    `# ${APP_NAME}`,
    '',
    `> ${APP_DESCRIPTION}`,
    '',
    '## Sections',
    '',
    ...sections,
    '',
  ];

  return new Response(body.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export { llmsTextResponse };
