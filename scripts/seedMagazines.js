const mongoose = require("mongoose");
const { Magazine } = require("../required/db");
require("dotenv").config();

// List of magazines to upsert (keep in sync with your desired data)
const magazines = [
  {
    title: "AI Magazine - Machine Learning & Deep Learning",
    description:
      "The world's leading bi-monthly AI magazine covering ML, deep learning, neural networks, and AI applications.",
    image_url:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    content_url: "https://aimagazine.com/",
  },
  {
    title: "Quanta Magazine - Machine Learning Research",
    description:
      "Explore cutting-edge machine learning research, from cellular automata to world models.",
    image_url:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    content_url: "https://www.quantamagazine.org/tag/machine-learning/",
  },
  {
    title: "Natural Language Processing Journal",
    description:
      "Open access journal advancing trustworthy, interpretable NLP and hybrid AI.",
    image_url:
      "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80",
    content_url:
      "https://www.sciencedirect.com/journal/natural-language-processing-journal",
  },
  {
    title: "Frontiers in AI - Natural Language Processing",
    description:
      "Latest research in NLP including transformer models, chatbots, question answering, and language generation.",
    image_url:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    content_url:
      "https://www.frontiersin.org/journals/artificial-intelligence/sections/natural-language-processing",
  },
  {
    title: "DevOps Cube - Shell Scripting for DevOps",
    description:
      "Master Linux shell scripting and Bash automation for DevOps. Comprehensive guides and real-world examples.",
    image_url:
      "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80",
    content_url: "https://devopscube.com/linux-shell-scripting-for-devops/",
  },
  {
    title: "Medium - 25 Essential Bash Scripts for DevOps",
    description:
      "Practical Bash scripts for automating monitoring, backups, deployments, and security checks.",
    image_url:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80",
    content_url:
      "https://medium.com/@akhandsinghofficial/25-essential-bash-scripts-for-beginner-devops-engineers-c37d0cc45a1a",
  },
  {
    title: "Codemotion - Top 10 CI/CD Tools in 2025",
    description:
      "Comprehensive guide to the best CI/CD tools including Jenkins, GitLab CI/CD, GitHub Actions, and more.",
    image_url:
      "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
    content_url:
      "https://www.codemotion.com/magazine/devops/top-10-ci-cd-tools-in-2025/",
  },
  {
    title: "The New Stack - CI/CD Environment & DevOps",
    description:
      "Breaking news and analysis on CI/CD pipelines, Kubernetes, GitOps, and cloud-native practices.",
    image_url:
      "https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=800&q=80",
    content_url: "https://thenewstack.io/ci-cd/",
  },
  {
    title: "DevOps Magazine - Continuous Integration & Delivery",
    description:
      "Expert insights on CI/CD best practices, platform engineering, and the future of DevOps.",
    image_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    content_url: "https://devopscon.io/whitepaper/devops-magazine-1-20/",
  },
  {
    title: "Technology Magazine - AI & Machine Learning",
    description:
      "Latest AI and machine learning articles covering robotics, computational intelligence, and enterprise AI solutions.",
    image_url:
      "https://images.unsplash.com/photo-1655635643532-fa9ba2648cbe?w=800&q=80",
    content_url: "https://technologymagazine.com/ai-and-machine-learning",
  },
];

async function upsertMagazines() {
  try {
    console.log(
      "Connecting to DB via existing mongoose connection (from required/db)..."
    );
    // required/db already connects mongoose when required; just use the model

    for (const mag of magazines) {
      const filter = { title: mag.title };
      const update = { $set: mag };
      const opts = { upsert: true };
      const res = await Magazine.updateOne(filter, update, opts);
      console.log(
        `Upserted '${mag.title}' -> matched:${res.matchedCount} modified:${res.modifiedCount} upsertedId:${res.upsertedId}`
      );
    }

    console.log("Magazine upsert complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error upserting magazines:", err);
    process.exit(1);
  }
}

// Run when invoked
if (require.main === module) {
  upsertMagazines();
}

module.exports = upsertMagazines;
