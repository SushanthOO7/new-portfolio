import GlassFolder from '../ui/glass-folder-cards.tsx';
import './projects-folder.css';

type Project = {
  id: string; title: string; description: string; tags: string[]; url: string;
  image: { dark: string; light?: string; alt: string };
};

export default function ProjectsFolder({ projects }: { projects: Project[] }) {
  return <div className="project-folder-desk">
    <GlassFolder label="Projects" meta={`${projects.length} projects`} art="none" action="none" labelPlacement="top-left"
      files={projects.map(project => ({ name: project.title, description: project.description, tags: project.tags,
        image: project.image.dark, lightImage: project.image.light, alt: project.image.alt, href: project.url }))} />
    <p className="project-folder-hint">Click to open · Select a project to explore</p>
    <a className="project-folder-more" href="https://github.com/SushanthOO7?tab=repositories" target="_blank" rel="noopener noreferrer">Other projects <span aria-hidden="true">↗</span><span className="sr-only"> on GitHub (opens in a new tab)</span></a>
  </div>;
}
