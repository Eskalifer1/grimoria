import { EllipsisIcon, InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TooltipText } from '@/shared/components/TooltipText';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';

/**
 * A dev-only surface so the menu, the tooltip and both badge variants are
 * reachable and checkable in both Themes. Removed once that check is done — not
 * a feature (#116).
 */
function PrimitivesPlayground() {
  const t = useTranslations('primitivesPlayground');

  return (
    <section className="mt-6 flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={t('menuLabel')} size="icon" variant="outline">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t('menuTitle')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{t('menuRename')}</DropdownMenuItem>
          <DropdownMenuItem>{t('menuDuplicate')}</DropdownMenuItem>
          <DropdownMenuItem disabled>{t('menuShare')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">{t('menuDelete')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label={t('tooltipTriggerLabel')} size="icon" variant="outline">
            <InfoIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('tooltipBody')}</TooltipContent>
      </Tooltip>

      <TooltipText tooltip={t('textTooltip')}>{t('textWithTooltip')}</TooltipText>

      <Badge>{t('tagBadge')}</Badge>
      <Badge variant="public">{t('publicBadge')}</Badge>
    </section>
  );
}

export { PrimitivesPlayground };
