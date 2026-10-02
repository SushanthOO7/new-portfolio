import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from './projects-data.json';

function ProjectDetail() {
  const { id } = useParams();
  const project = projectsData.find(proj => proj.id === id);

  if (!project) {
    return <div style={{ color: '#fff', padding: '4rem' }}>Project not found.</div>;
  }

  return (
    <div
      style={{ background: '#111', color: '#fff', minHeight: '100vh', padding: '3rem 0' }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto 2rem auto',
          padding: '2rem',
          background: '#23252c',
          borderRadius: '1.5rem',
          boxShadow: '0 0 32px #0007',
        }}
      >
        <Link
          to="/projects"
          style={{
            color: '#8fe1ff',
            textDecoration: 'underline',
            fontWeight: 500,
            marginBottom: 24,
            display: 'inline-block',
          }}
        >
          &larr; Back to Projects
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>{project.name}</h1>
        <p style={{ marginBottom: 18, opacity: 0.72 }}>{project.shortDescription}</p>

        {project.images && project.images.length > 0 && (
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: 24 }}
          >
            {project.images.map((src, idx) => (
              <img
                key={src}
                src={require(`../../assets/${src}`)}
                alt={project.name + ' image ' + (idx + 1)}
                style={{
                  maxWidth: 310,
                  background: '#343945',
                  borderRadius: '0.6rem',
                  boxShadow: '0 1px 8px #0008',
                }}
                loading="lazy"
              />
            ))}
          </div>
        )}

        <p style={{ fontSize: '1.2em', marginBottom: 18 }}>{project.longDescription}</p>

        {project.links && project.links.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>Links:</strong>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {project.links.map(link => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#5ec7eb', textDecoration: 'underline' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.papers && project.papers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>Papers:</strong>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {project.papers.map(paper => (
                <li key={paper.url}>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#c2e75b', textDecoration: 'underline' }}
                  >
                    {paper.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.research && (
          <div style={{ marginBottom: 12 }}>
            <strong>Research:</strong>
            <p style={{ marginBottom: 0 }}>{project.research}</p>
          </div>
        )}
        {project.videos && project.videos.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <strong>Videos:</strong>
            {project.videos.map((src, idx) => (
              <video
                key={src}
                controls
                style={{
                  display: 'block',
                  maxWidth: 600,
                  margin: '1rem 0 0 0',
                  borderRadius: 8,
                  background: '#111',
                }}
              >
                <source src={require(`../../assets/${src}`)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
