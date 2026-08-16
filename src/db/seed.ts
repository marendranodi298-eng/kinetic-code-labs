import { db } from "./index";
import { posts } from "./schema";
import { count } from "drizzle-orm";

async function main() {
  console.log("Starting database seeding...");
  const startTime = Date.now();

  // 1. Check if posts already exist
  const existingCountResult = await db.select({ val: count() }).from(posts);
  const existingCount = existingCountResult[0]?.val || 0;

  if (existingCount > 100) {
    console.log(`Database already contains ${existingCount} posts. Skipping seed to prevent duplicates.`);
    return;
  }

  console.log("Generating 1,000 mock posts...");
  const mockPosts = [];
  const formats: ("news" | "photo" | "video")[] = ["news", "photo", "video"];
  
  // High-quality placeholder media assets
  const mockImages = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
  ];
  
  const mockVideos = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  ];

  for (let i = 1; i <= 1000; i++) {
    const type = formats[i % 3];
    const id = `seed_${Math.random().toString(36).substring(2, 11)}_${i}`;
    const title = `Kinetic Insight #${i}: ${
      type === "news" 
        ? "Scaling Microservices and Web Cache Invalidation" 
        : type === "photo" 
          ? "Visual Representation of Complex Network Topologies" 
          : "Streaming Optimized Video Pipelines with Edge Networks"
    }`;
    
    // Slug generation
    const slug = `kinetic-insight-${i}-${Math.random().toString(36).substring(2, 6)}`;
    
    const summary = `Deep dive technical guide #${i} analyzing modern computer science concepts, deployment strategies, and optimization metrics for system engineers.`;
    
    const content = `# Introduction to Technical Insight #${i}\n\n` +
      `Deploying large-scale applications requires thorough planning and optimization. This article details our latest research regarding server-side efficiency and network layouts.\n\n` +
      `## Key Optimization Strategies\n` +
      `- Use caching layers at the edge to reduce load on the primary SQLite database.\n` +
      `- Enable Write-Ahead Logging (WAL) for high concurrency local storage.\n` +
      `- Deliver images and videos utilizing CDN providers such as Cloudinary with automatic format optimization.\n\n` +
      `### Benchmarks & Testing\n` +
      `When benchmarking millions of rows, indexing is the single most critical factor. By placing a composite index on \`published\` and \`created_at\`, we reduce page lookup speed from O(N) to O(log N).\n\n` +
      `**Conclusion**: Optimize early, benchmark often, and always leverage indexed constraints.`;

    // Choose media based on type
    const mediaUrl = type === "photo" 
      ? mockImages[i % mockImages.length] 
      : type === "video" 
        ? mockVideos[i % mockVideos.length] 
        : null;

    const mediaPublicId = mediaUrl ? `seed_asset_${i}` : null;
    const mediaType = type === "photo" ? "image/jpeg" : type === "video" ? "video/mp4" : null;

    // Distribute creation dates over the last 365 days
    const dateOffset = Math.floor(Math.random() * 365);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - dateOffset);

    mockPosts.push({
      id,
      title,
      slug,
      type,
      summary,
      content,
      mediaUrl,
      mediaPublicId,
      mediaType,
      mediaWidth: type === "photo" ? 800 : null,
      mediaHeight: type === "photo" ? 600 : null,
      views: Math.floor(Math.random() * 25000), // Random views count
      published: Math.random() > 0.05, // 95% published, 5% drafts
      createdAt,
      updatedAt: createdAt,
    });
  }

  // 2. Insert in batches of 100 to optimize SQLite performance
  console.log("Inserting posts in batches...");
  const batchSize = 100;
  for (let i = 0; i < mockPosts.length; i += batchSize) {
    const batch = mockPosts.slice(i, i + batchSize);
    await db.insert(posts).values(batch);
    console.log(`Inserted batch ${i / batchSize + 1}/${mockPosts.length / batchSize}`);
  }

  const timeTaken = Date.now() - startTime;
  console.log(`Success! Seeded 1,000 blog posts in ${timeTaken}ms.`);
}

main().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
