import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function CtaGithub() {
  return (
    <Button variant='outline' asChild size='sm' className='group hidden h-9 w-9 rounded-full sm:flex border-primary/20 hover:bg-primary/10 transition-all'>
      <a
        href='https://github.com/Fahrizp24'
        rel='noopener noreferrer'
        target='_blank'
        className='dark:text-foreground transition-colors duration-300 hover:text-primary dark:hover:text-primary'
      >
        <Icons.github className='transition-transform duration-300 group-hover:scale-110' />
      </a>
    </Button>
  );
}
