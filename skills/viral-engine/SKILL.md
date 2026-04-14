---
name: viral-engine
description: Use when creating social media content designed to go viral. Takes insights from content-intel analysis and generates posts, hooks, scripts, captions, and content calendars optimized for maximum engagement. Works across Instagram, TikTok, Twitter/X, YouTube, and LinkedIn.
---

# Viral Engine

Generate social media content engineered for virality — based on real data from what's actually working in your niche right now.

## Trigger on requests like

- write me a viral post about [topic]
- create content for this week
- generate Instagram captions
- write TikTok scripts
- make me a content calendar
- write a Twitter thread about [topic]
- create a carousel about [topic]
- what should I post today
- remix this viral post for my audience
- write hooks for my next 10 posts

## Prerequisites

- Content intelligence data (run content-intel skill first)
- User's content profile and niche
- Competitor/viral post examples for pattern matching

## Workflow

### Step 1: Load Intelligence

Before generating anything, load:
1. User's content profile (`content-profile.md`)
2. Latest intel report (`content-intel-report.md`)
3. Top-performing posts (yours and competitors)
4. Current trending topics

If these don't exist, prompt the user to run `content-intel` first.

### Step 2: Select Content Strategy

Based on the intel, recommend a strategy for this batch:

| Strategy | When to Use | Goal |
|----------|------------|------|
| **Trend-jack** | A topic is blowing up right now | Ride the wave for reach |
| **Evergreen authority** | Building long-term credibility | Saves and follows |
| **Contrarian take** | Everyone's saying the same thing | Comments and shares |
| **Story/proof** | You have a result or experience | Trust and engagement |
| **Educational** | Your audience needs to learn something | Saves and authority |
| **Entertainment** | Platform favors fun content (TikTok) | Views and shares |
| **Engagement bait** | Need to boost algorithm signals | Comments |

### Step 3: Generate Hooks

The hook is everything. Generate 10 hooks per post concept using proven patterns:

**Hook Formulas That Work:**

| Pattern | Example | Why It Works |
|---------|---------|-------------|
| **Shocking stat** | "97% of [audience] don't know this..." | Curiosity gap |
| **Contrarian** | "Stop doing [common advice]. Here's why." | Pattern interrupt |
| **Story open** | "I lost $50k before I learned this..." | Emotional pull |
| **List/promise** | "5 tools that changed my [outcome]" | Clear value |
| **Question** | "Why does nobody talk about [thing]?" | Engagement trigger |
| **Before/after** | "6 months ago I was [bad]. Now I [good]." | Transformation |
| **Secret/insider** | "The [industry] secret nobody shares..." | Exclusivity |
| **Challenge** | "Try this for 30 days and watch what happens" | Action trigger |
| **Time-based** | "In the next 60 seconds, I'll show you..." | Urgency |
| **Direct address** | "If you're a [role] making under [amount]..." | Targeting |

For each hook, rate it:
- **Scroll-stop power** (1-10): Would you stop scrolling?
- **Curiosity gap** (1-10): Does it make you need to know more?
- **Platform fit** (1-10): Does it match how this platform works?

### Step 4: Generate Platform-Specific Content

#### Instagram Reels Script
```
HOOK (0-3 sec): [attention grabber — text on screen + spoken]
SETUP (3-10 sec): [context — why this matters]
VALUE (10-40 sec): [the actual content — tips/story/proof]
CTA (40-50 sec): [what to do next — follow/comment/save]
CAPTION: [supporting text with hashtags]
HASHTAGS: [10-15 relevant hashtags, mix of sizes]
AUDIO: [trending audio suggestion if applicable]
```

#### Instagram Carousel
```
SLIDE 1 (COVER): [Hook headline — bold, clear, scroll-stopping]
SLIDE 2: [Problem or context]
SLIDE 3-7: [Value slides — one point per slide, visual]
SLIDE 8 (CTA): [Save this / Share with someone who needs this / Follow for more]
CAPTION: [expanded context + hashtags]
```

#### TikTok Script
```
HOOK (0-2 sec): [pattern interrupt — visual + text + voice]
BODY (2-30 sec): [fast-paced value delivery]
PAYOFF (30-45 sec): [the "aha" moment or punchline]
CTA (45-50 sec): [follow / comment your [X] / part 2?]
TEXT OVERLAY: [key phrases on screen throughout]
TRENDING SOUND: [suggestion]
```

#### Twitter/X Thread
```
TWEET 1 (HOOK): [bold claim or question — make people click "Show more"]
TWEET 2-8: [one idea per tweet, each valuable standalone]
TWEET 9 (SUMMARY): [recap the key takeaways]
TWEET 10 (CTA): [retweet if helpful / follow for more / reply with your [X]]
```

#### LinkedIn Post
```
HOOK LINE: [first 2 lines visible before "see more" — must compel click]
STORY/SETUP: [personal angle or industry insight]
VALUE: [3-5 key points or lessons]
CTA: [question to drive comments — "What's your take?" / "Agree or disagree?"]
HASHTAGS: [3-5 professional hashtags]
```

#### YouTube Short/Video
```
HOOK (0-5 sec): [thumbnail text + spoken hook]
INTRO (5-15 sec): [who you are + what they'll learn]
BODY (15-X min): [structured content with timestamps]
CTA (last 30 sec): [subscribe + comment prompt]
TITLE: [SEO-optimized, curiosity-driven]
DESCRIPTION: [keywords + links]
TAGS: [relevant search tags]
THUMBNAIL: [text overlay concept + visual direction]
```

### Step 5: Content Calendar

Generate a weekly content calendar:

```markdown
# Content Calendar — Week of [date]

## Monday
- Platform: Instagram
- Format: Carousel
- Topic: [topic from trending/gap analysis]
- Hook: [hook]
- Status: Draft

## Tuesday
- Platform: TikTok
- Format: Short video
- Topic: [topic]
- Hook: [hook]
- Status: Draft

## Wednesday
- Platform: Twitter/X
- Format: Thread
- Topic: [topic]
- Hook: [hook]
- Status: Draft

## Thursday
- Platform: LinkedIn
- Format: Text post
- Topic: [topic]
- Hook: [hook]
- Status: Draft

## Friday
- Platform: Instagram
- Format: Reel
- Topic: [topic]
- Hook: [hook]
- Status: Draft

## Saturday
- Platform: TikTok
- Format: Trend-jack
- Topic: [whatever's trending this week]
- Hook: [hook]
- Status: Draft

## Sunday
- Platform: Rest / batch prep for next week
```

### Step 6: Remix Viral Content

When the user shares a viral post they want to remix:

1. **Analyze the original**: What made it work? (hook, format, topic, timing)
2. **Extract the pattern**: What's the underlying formula?
3. **Apply to user's niche**: Same pattern, different content
4. **Differentiate**: Add your unique angle/proof/story
5. **Optimize for platform**: Adjust format for where you're posting

**Rules for remixing:**
- Never copy — transform
- Add your own data/experience/proof
- Change the hook but keep the structure
- Match your voice and brand, not theirs
- Post within 48 hours while the trend is hot

### Step 7: Engagement Optimization

For each piece of content, include:

**Posting checklist:**
- [ ] Post at optimal time (from intel data)
- [ ] First 30 minutes: respond to every comment
- [ ] Cross-post teaser to other platforms
- [ ] Add to stories with engagement sticker (poll, question, quiz)
- [ ] Share to relevant groups/communities
- [ ] DM 5-10 people who'd genuinely find it valuable

**Algorithm signals to maximize:**
| Signal | How to Trigger It |
|--------|------------------|
| Watch time | Hook hard, deliver fast, no fluff |
| Saves | Actionable tips people want to reference |
| Shares | Relatable content people send to friends |
| Comments | Ask a specific question, create debate |
| Follows | Tease more value ("follow for part 2") |
| Profile visits | Make them curious about you |

## Output

- Platform-specific content drafts (ready to post)
- 10 hooks per content concept
- Weekly content calendar
- Remixed versions of viral posts
- Posting checklists with optimal times
- Engagement strategy per post
