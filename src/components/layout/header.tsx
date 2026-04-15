import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import CtaGithub from './cta-github';
import { UserNav } from './user-nav';

export default function Header() {
  return (
    <header className='bg-background/95 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b-2 border-primary/10 backdrop-blur-sm shadow-sm'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <CtaGithub />
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <UserNav />
      </div>
    </header>
  );
}
