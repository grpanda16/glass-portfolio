export const EXPERIENCE = [
  { offset:'03', org:'Boeing', role:'Software Engineer', when:'Feb 2026 → present', place:'India · Hybrid',
    current:true,
    bullets:['Backend services and distributed systems in Java & Spring Boot.'],
    tags:['Java','Spring Boot','Microservices','Distributed Systems'] },
  { offset:'02', org:'CureBay', role:'Software Engineer — Mid', when:'Jun 2024 → Nov 2025 · 1y 6m', place:'Bhubaneswar · Hybrid',
    bullets:['Event-driven microservices on Apache Kafka.',
      'AuthN/AuthZ with Spring Security, JWT and Keycloak.',
      'REST APIs shipped to GCP via Docker-based CI/CD.',
      'Performance tuning and production issue resolution.'],
    tags:['Java','Spring Boot','Kafka','GCP','JWT','Keycloak','Docker'] },
  { offset:'01', org:'Certiview IT & Management Solutions', role:'Java Developer', when:'Jan 2022 → May 2024 · 2y 5m', place:'Bengaluru · Hybrid',
    bullets:['Java application development across the full request lifecycle.',
      'MEAN-stack work alongside the Java services.'],
    tags:['Java','MEAN Stack','REST APIs','MongoDB'] },
  { offset:'00', org:'TapAcademy', role:'Associate Software Developer', when:'Apr → Nov 2021 · 8m', place:'Bengaluru · On-site · Internship',
    bullets:['Server-side programming in Java.'],
    tags:['Java','Server-Side'] },
];


export const PROJECTS = [
  {
    name:'Connect Application',
    sub:'B2B Pharmacy / Healthcare Platform · CureBay',
    role:'Full Stack Java Developer',
    domain:'Healthcare e-commerce · Doctor consultation · OCR prescription · Bulk orders',
    bullets:[
      'Built ERP integrations and a Security Manager for secure, scalable business operations.',
      'Designed multiple Spring Boot microservices: medicine ordering, catalog/cart, prescription processing, bulk orders and consultation workflows.',
      'Built REST APIs with Spring MVC using a clean layered architecture — validation, logging and exception handling throughout.',
      'Optimised database access with Spring Data JPA/Hibernate, pagination and query tuning for high-volume requests.',
      'Drove end-to-end delivery with UI/QA/Product, taking features through to production readiness.',
    ],
    tags:['Java','Spring Boot','Angular','GCP','Spring Data JPA','MySQL','MongoDB','Microservices','Hexagonal Architecture'],
  },
  {
    name:'FDS — Financial Document Store',
    sub:'Financial Document Management System',
    role:'Java Developer',
    domain:'Document management for deals, transactions, companies and facilities',
    bullets:[
      'Developed microservices with Spring Boot, Spring MVC and Spring Data JPA over PostgreSQL.',
      'Implemented service-to-service communication with @FeignClient and REST Template; integrated Apache Kafka for asynchronous, event-driven processing.',
      'Built the Fax Module — fetch, update, delete, split and merge operations over document workflows.',
      'Added batch processing with scheduler locks to prevent duplicate execution across distributed instances.',
      'Added indexing and search to improve retrieval performance at volume, plus a permalink generator for secure document sharing.',
      'Enforced authentication/authorisation controls over sensitive financial documents; improved fault tolerance.',
    ],
    tags:['Java','Spring Boot','Apache Kafka','PostgreSQL','Feign Client','Spring Data JPA','Microservices','Maven'],
  },
];

export const STACK = [
  ['Languages', ['Java','JavaScript','SQL']],
  ['Backend', ['Spring Boot','Spring Security','JPA / Hibernate','REST APIs']],
  ['Front-end', ['React.js','Responsive UI']],
  ['Messaging', ['Apache Kafka','Google Pub/Sub']],
  ['Data', ['PostgreSQL','MySQL','MongoDB']],
  ['Auth', ['JWT','OAuth 2.0','Keycloak']],
  ['Cloud & Ops', ['GCP','AWS','Docker','CI/CD']],
  ['Exploring', ['GenAI integration']],
];

export const LINKS = {
  github:'https://github.com/grpanda16',
  linkedin:'https://www.linkedin.com/in/gyana16/',
  email:'gr.panda16@gmail.com',
  // Résumé temporarily points to LinkedIn (accurate & current).
  // To use a real PDF: drop it at public/resume.pdf and set resume:'/resume.pdf'
  resume:'/resume.pdf',
};
