import React from "react";
import { Github, Linkedin, Briefcase } from "lucide-react";

const TeamMember = ({ role, name, image, linkedin, github }) => (
  <div className="group relative overflow-hidden bg-[rgb(var(--bg-secondary))] rounded-2xl border border-[rgb(var(--border))] hover:shadow-xl transition-all duration-300">
    <div className="aspect-square w-full overflow-hidden bg-gray-200 dark:bg-gray-800 relative">
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name || role
          )}&background=random`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
        <div className="flex gap-4">
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {(github || github === "") && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
    <div className="p-5 text-center">
      <div className="inline-flex items-center justify-center p-2 mb-3 rounded-full bg-[rgb(var(--primary))/10] text-[rgb(var(--primary))]">
        <Briefcase className="w-4 h-4" />
      </div>
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[rgb(var(--text))] to-[rgb(var(--text))/70] mb-1">
        {name || "Team Member"}
      </h3>
      <p className="text-sm font-medium text-[rgb(var(--text))/60] uppercase tracking-wider">
        {role}
      </p>
    </div>
  </div>
);

const Team = () => {
  const members = [
    {
      role: "Fullstack Developer",
      name: import.meta.env.VITE_FULLSTACK_NAME,
      image: "/profile-fullstack.jpg",
      linkedin: import.meta.env.VITE_FULLSTACK_LINKEDIN,
      github: import.meta.env.VITE_FULLSTACK_GITHUB,
    },
    {
      role: "Frontend Developer",
      name: import.meta.env.VITE_FRONTEND_NAME,
      image: "/profile-frontend.jpg",
      linkedin: import.meta.env.VITE_FRONTEND_LINKEDIN,
      github: import.meta.env.VITE_FRONTEND_GITHUB,
    },
    {
      role: "Manager",
      name: import.meta.env.VITE_MANAGER_NAME,
      image: "/profile-manager.jpg",
      linkedin: import.meta.env.VITE_MANAGER_LINKEDIN,
      github: import.meta.env.VITE_MANAGER_GITHUB,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[rgb(var(--text))]">
          Meet Our <span className="text-[rgb(var(--primary))]">Team</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-[rgb(var(--text))/70]">
          The talented individuals behind building AY Electronics Software.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
        {members.map((member, index) => (
          <TeamMember key={index} {...member} />
        ))}
      </div>
    </div>
  );
};

export default Team;
