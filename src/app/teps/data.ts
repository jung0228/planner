export type Option = { label: "a" | "b" | "c" | "d"; text: string };

export type Question = {
  id: number;
  part: "I" | "II" | "III" | "IV";
  partLabel: string;
  passage: string;
  passageTitle?: string;
  question: string;
  options: Option[];
  answer: "a" | "b" | "c" | "d";
  groupId?: number; // Part IV questions share passages in pairs
};

export const questions: Question[] = [
  // ──────────────── PART I ────────────────
  {
    id: 1,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "Steve Webb, founder of technology start-up WebbWear Systems, is auctioning off a chance to visit the WebbWear headquarters next month! The auction will be conducted via the WebbWear homepage, and all proceeds will go to a nonprofit cancer research center. Steve himself will be leading the tour, so the winner will have the chance to get insights about running a successful business. Go to WebbWear.com this weekend for your chance to _____.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "invest in Steve Webb's latest start-up" },
      { label: "b", text: "land a job at WebbWear's headquarters" },
      { label: "c", text: "be the first to buy WebbWear's new product" },
      { label: "d", text: "get a close-up look at WebbWear with its founder" },
    ],
    answer: "d",
  },
  {
    id: 2,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "Recent research in the field of health and nutrition suggests that food cravings are driven by _____. Cravings were once believed to be signs of nutritional deficiencies in the body. But if this were true, the most common cravings would be for fruits and vegetables, the foods most lacking in people's diets. Instead, cravings are typically for high-calorie and high-fat comfort foods. Thus, it is more likely that food cravings are the result of emotional factors. This explanation is supported by the fact that comfort foods are known to boost levels of serotonin, a chemical with a calming effect.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "nutrients that the body requires" },
      { label: "b", text: "a lack of fruit and vegetable intake" },
      { label: "c", text: "sudden increases in serotonin levels" },
      { label: "d", text: "emotional rather than physical need" },
    ],
    answer: "d",
  },
  {
    id: 3,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "Looking for a unique dining experience? Inspired by the jazz clubs of the 1930s, Blackpool Bistro has more than fantastic food—it also offers live music and a fabulous dance floor where you can enjoy a few dances between courses of your sumptuous dinner. Our decorations are all genuine antiques, and our staff dress in styles from the period, all to give you a taste of what it must have been like at the old jazz clubs. So for a memorable evening, come to Blackpool Bistro, where you can _____.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "enjoy the city's oldest remaining jazz club" },
      { label: "b", text: "experience the fancy nightlife of a bygone era" },
      { label: "c", text: "watch professional jazz dancers while you dine" },
      { label: "d", text: "hear the best jazz music from the 1930s to today" },
    ],
    answer: "b",
  },
  {
    id: 4,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "People who indulge in excessive self-love are referred to as narcissists. The term \"narcissism\" is derived from the name of Narcissus, a beautiful boy in Greek mythology who was captivated by his own reflection in a pool. But Narcissus did not initially know that he was staring at his own image. In fact, in one version of the myth, Narcissus was horrified and guilt-stricken when he realized that he had been admiring his own face. Considering such details, Narcissus may have been _____.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "blinded by love for his own reflection" },
      { label: "b", text: "unaware of the beauty surrounding him" },
      { label: "c", text: "completely oblivious to others' admiration" },
      { label: "d", text: "wrongly characterized as being self-absorbed" },
    ],
    answer: "d",
  },
  {
    id: 5,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "In order to more effectively motivate students to work, researchers suggest _____. Consider this example—students from two college classes are given a chance to opt out of taking an exam, but it is presented differently. The first class can earn the right by accumulating points; the second can lose the right by failing to reach a set number of points. In this scenario, the second option is more effective. This is because people are more motivated to avoid losing something they already have than to strive to get what they currently do not.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "framing tasks in terms of loss avoidance" },
      { label: "b", text: "offering rewards rather than punishments" },
      { label: "c", text: "providing an optional exemption from an exam" },
      { label: "d", text: "giving them a choice of losing or gaining something" },
    ],
    answer: "a",
  },
  {
    id: 6,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "Experts are concerned that the recently proposed warning labels on high-sugar snacks and drinks will _____. Studies demonstrate that such labels do cause parents to reconsider giving their children unhealthy items. However, experts note that the strength of the effect depends in large part on the novelty of the warnings. They say that if these warning labels were to be introduced, parents could become so accustomed to seeing them that they would eventually stop taking notice and revert to their old habits.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "face resistance from consumers" },
      { label: "b", text: "fail to contain forceful messages" },
      { label: "c", text: "lose their effectiveness over time" },
      { label: "d", text: "be ignored virtually from the start" },
    ],
    answer: "c",
  },
  {
    id: 7,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "Mere weeks after its launch in February 2016, the satellite observatory Hitomi was lost following a _____. The disaster occurred in the wake of Hitomi's transition from supervised commissioning mode to standard operation. After its first unmonitored maneuver, Hitomi had difficulties determining its orientation because its star tracker system was not functioning properly. Thus, Hitomi relied on its gyroscope-based sensor, which incorrectly reported that the satellite was rotating. The faulty data triggered Hitomi's reaction wheels, which were designed to counter such rotation. However, their activation put the satellite in an actual spin. The rocket thrusters were its final hope, but inaccurate calculations sent Hitomi spinning to its demise.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "disastrous trial observation period" },
      { label: "b", text: "series of glitches and malfunctions" },
      { label: "c", text: "loss of power to its rocket thrusters" },
      { label: "d", text: "premature shift into supervised mode" },
    ],
    answer: "b",
  },
  {
    id: 8,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "Amid the collapse of the Ottoman Empire, US President Woodrow Wilson dispatched two commissioners to the Middle East. He tasked them with interviewing local leaders to establish new national borders that would separate people according to ethnic, linguistic, and religious differences. Wilson was sure that such borders would resolve the long-standing conflicts plaguing the region. However, the commissioners' interviews often led them to the opposite conclusion. They found that highlighting the differences between certain groups would only create more friction. In their final report, they therefore argued that adherence to Wilson's border strategy might actually _____.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "foster rather than forestall antagonisms" },
      { label: "b", text: "undermine hard-won peace agreements" },
      { label: "c", text: "make national boundaries harder to define" },
      { label: "d", text: "lead to another war against the Middle East" },
    ],
    answer: "a",
  },
  {
    id: 9,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passage:
      "The US government first adopted the term \"Hispanic\" in the early 1970s. The US census defined a Hispanic person as \"a person of Mexican, Puerto Rican, Cuban, Central or South American, or other Spanish culture or origin, regardless of race.\" But there are grey areas where this definition seems to break down. _____, it is debated whether Brazilians, who are obviously South American but speak Portuguese instead of Spanish, should be called Hispanics.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "Similarly" },
      { label: "b", text: "Therefore" },
      { label: "c", text: "In addition" },
      { label: "d", text: "For example" },
    ],
    answer: "d",
  },
  {
    id: 10,
    part: "I",
    partLabel: "빈칸에 알맞은 것 고르기",
    passageTitle: "The Gendered Impact of Automation",
    passage:
      "According to experts, the growing trend toward automation in the workplace will have a disproportionately negative impact on female workers. This is because female workers predominate in certain industries, such as retail, which are expected to automate many roles in the near future. _____, men dominate the science and technology fields that are driving the shift toward automation, leading to lower losses for men in terms of employment.",
    question: "빈칸에 들어갈 가장 알맞은 것을 고르시오.",
    options: [
      { label: "a", text: "Particularly" },
      { label: "b", text: "Conversely" },
      { label: "c", text: "Otherwise" },
      { label: "d", text: "Instead" },
    ],
    answer: "b",
  },

  // ──────────────── PART II ────────────────
  {
    id: 11,
    part: "II",
    partLabel: "어색한 문장 고르기",
    passage:
      "(a) The word originated from a Greek word meaning \"speaker of an incomprehensible language.\" (b) While most ancient Greeks shared the same language and culture, their specific tribes of origin were also important. (c) As such, all foreigners were called barbarians, and the word was not a derogatory term. (d) Eventually, conflicts with other peoples gave the word negative connotations of \"uncivilized\" and \"violent,\" which still apply today.",
    question:
      "The word \"barbarian\" has evolved to mean something quite different from its original definition. 다음 중 글의 흐름에 어울리지 않는 문장을 고르시오.",
    options: [
      { label: "a", text: "(a)" },
      { label: "b", text: "(b)" },
      { label: "c", text: "(c)" },
      { label: "d", text: "(d)" },
    ],
    answer: "b",
  },
  {
    id: 12,
    part: "II",
    partLabel: "어색한 문장 고르기",
    passage:
      "A house in the booming Bloomfield neighborhood sold for almost twice its asking price despite its dilapidated state. (a) The house, with a partially collapsed ceiling and crumbling floors, seemed like a difficult sale. (b) But its asking price, quite low for the highly desired area, caught the attention of many home buyers. (c) The new owner, whose offer was accepted after an intense bidding war, stated that she plans to demolish the house and build a new one. (d) According to city codes, a demolition permit is required to remove any structure that needed a building permit for construction.",
    question: "다음 중 글의 흐름에 어울리지 않는 문장을 고르시오.",
    options: [
      { label: "a", text: "(a)" },
      { label: "b", text: "(b)" },
      { label: "c", text: "(c)" },
      { label: "d", text: "(d)" },
    ],
    answer: "d",
  },

  // ──────────────── PART III ────────────────
  {
    id: 13,
    part: "III",
    partLabel: "독해 (주제/세부 파악)",
    passageTitle: "Globalverse 광고",
    passage:
      "Want an eye-opening cultural experience without leaving home?\n\nGlobalverse is looking for families willing to welcome foreign students into their homes for periods of six to twelve months. Share your own culture and local customs while also learning more about the students' home countries. You could even end up with a life-long contact abroad after your student returns home.\n\nVisit www.globalverse.com for more details!",
    question: "Who is the advertisement mainly targeting?",
    options: [
      { label: "a", text: "Families with children studying abroad" },
      { label: "b", text: "Organizers for language exchange programs" },
      { label: "c", text: "Local students willing to assist foreign students" },
      { label: "d", text: "Potential homestay hosts for international students" },
    ],
    answer: "d",
  },
  {
    id: 14,
    part: "III",
    partLabel: "독해 (주제/세부 파악)",
    passage:
      "London has one of the world's most expensive property markets. In 2016, the average price of an apartment in the city was over £500,000. Londoners are being priced out of the market partly due to affluent overseas buyers. Many of them view London homes as investments and buy up new properties at sky-high prices. What's more, developers cater to these investors by building luxury residences that are simply out of reach to average Londoners.",
    question: "What is the writer's main point?",
    options: [
      { label: "a", text: "New immigrants to London cannot afford property." },
      { label: "b", text: "Luxury homes are being built by foreigners in London." },
      { label: "c", text: "Sales to foreigners are driving up London property prices." },
      { label: "d", text: "Overseas investors are profiting from properties in London." },
    ],
    answer: "c",
  },
  {
    id: 15,
    part: "III",
    partLabel: "독해 (주제/세부 파악)",
    passageTitle: "Mexicana Grill's Latest Tactic to Survive — The Newtown Post",
    passage:
      "Half a year after the food poisoning outbreak at several Mexicana Grill restaurants, the food chain is still struggling. Despite numerous advertising campaigns stressing its improved food safety standards, it has been unable to entice customers to return. Now it is rolling out a new marketing drive, mailing thousands of coupons across the country. These coupons can be redeemed for a free burrito at any one of its locations. The company hopes that this drive will bring customers back and reestablish confidence in its products' quality.",
    question: "What is the main topic of the news report?",
    options: [
      { label: "a", text: "Mexicana Grill's discounts on new premium burritos" },
      { label: "b", text: "Mexicana Grill's promotion to reward loyal customers" },
      { label: "c", text: "Mexicana Grill's efforts to win back skeptical customers" },
      { label: "d", text: "Mexicana Grill's campaign for better food safety procedures" },
    ],
    answer: "c",
  },
  {
    id: 16,
    part: "III",
    partLabel: "독해 (주제/세부 파악)",
    passage:
      "Bright, neon-colored murals known as chicha cover the walls alongside roadways in Peru. More than just a form of street art, chicha began as a genre of music in the 1960s. In the 1980s, popular chicha band Los Shapis, known for their colorful stage outfits, collaborated with artists to advertise their concerts with bright neon posters evocative of their characteristic fashion. Over time, the posters caught on with graffiti artists, who produce murals in a similar style to this day.",
    question: "What is the passage mainly about?",
    options: [
      { label: "a", text: "How graffiti art was embraced by a music industry" },
      { label: "b", text: "How street art popularized a music genre in the 1960s" },
      { label: "c", text: "How one band's publicity efforts engendered an art form" },
      { label: "d", text: "How street art persisted after the decline of a music genre" },
    ],
    answer: "c",
  },
  {
    id: 17,
    part: "III",
    partLabel: "독해 (세부 내용 파악)",
    passageTitle: "이메일 — From: Matthew Kemery / To: All",
    passage:
      "Subject: Schedule changes\n\nDear Class,\nThe midterm exam, originally scheduled for March 16, will be held a week later due to the delays caused by group presentations. This change will not affect our normal textbook reading schedule, so students should continue reading as planned. Furthermore, you will take the final exam on May 20, a day later than originally scheduled. The updated syllabus has been posted on the school website. Thank you.\n\nRegards,\nMr. Kemery",
    question: "Which of the following is correct according to the email?",
    options: [
      { label: "a", text: "The midterm exam has been rescheduled for March 16." },
      { label: "b", text: "The textbook reading schedule will not be adjusted." },
      { label: "c", text: "The final exam was initially scheduled for May 21." },
      { label: "d", text: "The revised syllabus will be posted online soon." },
    ],
    answer: "b",
  },
  {
    id: 18,
    part: "III",
    partLabel: "독해 (세부 내용 파악)",
    passage:
      "I've worked in the crab industry for years. When I started, business was smooth and profitable. But during this past year, a new type of algae infestation became common, which made some crabs toxic for people to eat. Fearing to sell even one tainted crab, I waited until the government confirmed that they were no longer contaminated. It took about four months for the issue to clear up, meaning I had no income the entire time. I'm still struggling to make up the difference.",
    question: "Which of the following is correct about the writer?",
    options: [
      { label: "a", text: "He first entered the crab industry this past year." },
      { label: "b", text: "He struggled to make a profit when he first started." },
      { label: "c", text: "He made no crab sales during the algae infestation." },
      { label: "d", text: "He has recouped the money lost due to the algae." },
    ],
    answer: "c",
  },
  {
    id: 19,
    part: "III",
    partLabel: "독해 (세부 내용 파악)",
    passageTitle: "Oceanic Airlines Narrowly Avoids Accident — June 29",
    passage:
      "An Oceanic Airlines plane nearly collided with a commercial drone while landing at Burling Airport yesterday. The airplane was roughly 2,000 feet in the air at the time, and the drone passed 250 feet below it. The airplane's pilot landed without taking evasive action, but airport police were alerted immediately about the incident. Drones are prohibited from flying higher than 400 feet and within 5 miles of an airport, so the drone operation was in clear violation of regulations. Neither the drone nor its operator has been located by police.",
    question: "Which of the following is correct according to the news report?",
    options: [
      { label: "a", text: "The drone remained 2,000 feet away from the plane." },
      { label: "b", text: "The airplane changed course in response to the drone." },
      { label: "c", text: "The maximum legal altitude for drones is 250 feet." },
      { label: "d", text: "The drone operator has not been captured by police." },
    ],
    answer: "d",
  },
  {
    id: 20,
    part: "III",
    partLabel: "독해 (세부 내용 파악)",
    passage:
      "Periodical cicadas are the world's longest-living insects, with each brood, or group of insects, emerging after remaining many years underground. Female cicadas carve slits into tree branches, lay up to 600 eggs inside, and then immediately depart. Six to eight weeks later, the immature cicadas, known as nymphs, hatch and fall to the ground. They burrow into tree roots and survive on root fluids until they are ready to take flight either 13 or 17 years later. Approximately 98% of nymphs never make it to adulthood, yet millions of periodical cicadas darken the skies with each brood.",
    question: "Which of the following is correct about periodical cicadas?",
    options: [
      { label: "a", text: "They lay eggs in slits carved into tree roots." },
      { label: "b", text: "Females do not remain with the eggs they lay." },
      { label: "c", text: "Their eggs hatch 13 or 17 years after they are laid." },
      { label: "d", text: "Roughly 98% of nymphs survive to reach maturity." },
    ],
    answer: "b",
  },
  {
    id: 21,
    part: "III",
    partLabel: "독해 (세부 내용 파악)",
    passageTitle: "Brunsland University Job Openings — Special Collections Librarian",
    passage:
      "Job no: 494803 / Work type: Full-time / Location: East Asian Library\n\nThe East Asian Library at Brunsland University is hiring for the position of special collections librarian. The review of applications will begin on April 1, and the position will remain open until filled.\n\nQualifications: Minimum requirements include a bachelor's degree in Asian studies and at least four years' experience working in an academic library. Preferred qualifications include an additional degree in library science and a working knowledge of Chinese, Japanese, or Korean.\n\nThe salary for this position will be negotiated based on qualifications and experience.",
    question: "Which of the following is a requirement for the position?",
    options: [
      { label: "a", text: "A library science degree" },
      { label: "b", text: "Proficiency in an Asian language" },
      { label: "c", text: "Working experience at any library" },
      { label: "d", text: "An undergraduate degree in Asian studies" },
    ],
    answer: "d",
  },
  {
    id: 22,
    part: "III",
    partLabel: "독해 (세부 내용 파악)",
    passage:
      "Scarlet fever is a bacterial disease that typically affects children. It was a leading cause of death until effective antibiotics were discovered in the early decades of the 20th century. However, even before scarlet fever first started to be treated with modern antibiotics, its virulence had been diminishing gradually through a natural process. Currently, infection rates generally surge at four-year intervals, though outbreaks unrelated to this cycle also occur. In 2015, England and Wales suffered one such outbreak, which resulted in over 17,500 infections. Fortunately, no fatalities were recorded.",
    question: "Which of the following is correct about scarlet fever?",
    options: [
      { label: "a", text: "Fatalities had become rare by the start of the 20th century." },
      { label: "b", text: "It did not diminish in severity until the use of modern antibiotics." },
      { label: "c", text: "Outbreaks now tend to occur according to a regular pattern." },
      { label: "d", text: "The 2015 outbreak in England and Wales caused many deaths." },
    ],
    answer: "c",
  },
  {
    id: 23,
    part: "III",
    partLabel: "독해 (추론)",
    passage:
      "After maintaining a long-distance relationship for five years, my fiancé and I are finally getting married next month. After he proposed, we had to choose where to live. We're both attracted to living in a big, dynamic city like the one where I'm working as a pharmacist. But he has a thriving business in a small mining town, and hourly rates are higher for pharmacists there. In the end, we made the decision that made the most financial sense. We'll be closer to early retirement, when we can enjoy our lives wherever we please!",
    question: "What can be inferred about the writer from the passage?",
    options: [
      { label: "a", text: "She has no plans to work after marriage." },
      { label: "b", text: "She decided to relocate to join her fiancé." },
      { label: "c", text: "She has spent much of her life in small towns." },
      { label: "d", text: "She intends to live in the mining town after retiring." },
    ],
    answer: "b",
  },
  {
    id: 24,
    part: "III",
    partLabel: "독해 (추론)",
    passageTitle: "Letters to the Editor",
    passage:
      "To the Editor:\n\nYour article on the pressures women face in the workplace was interesting. I'd like to add that the pressures men face are also worth discussing.\n\nProfessional success and the ability to provide for the family have long been crucial to men's identities. But these days, many men find themselves facing unstable job situations, and many are no longer the breadwinners of their families. Finding it difficult to cope with such changes, some men even experience depression. Men, as well as women, should be reminded that they need not be trapped in unhealthy approaches to gender roles.\n\n—Darren Johnson",
    question: "Which statement would the writer most likely agree with?",
    options: [
      { label: "a", text: "Men should feel that it is acceptable not to be the primary provider." },
      { label: "b", text: "Gender stereotyping is more detrimental to men than to women." },
      { label: "c", text: "Ensuring that breadwinners are male promotes family stability." },
      { label: "d", text: "Men who fail at work have only themselves to blame for it." },
    ],
    answer: "a",
  },
  {
    id: 25,
    part: "III",
    partLabel: "독해 (추론)",
    passage:
      "In 1920, the Baltic German aristocrat Baron Ungern-Sternberg waged a brutal campaign to conquer Mongolia. As a loyalist to the Russian monarchy, he envisioned using Mongolia as a staging ground to retake Russia from the Bolsheviks, who had dethroned the tsar in the Russian Revolution. With tsarist soldiers, he attacked the Chinese forces ruling Mongolia, gathering support among Mongolians with promises of independence. As a convert to Buddhism, he also found backing from Bogd Kahn, Mongolia's traditional Buddhist ruler, who had been detained by the Chinese. Ungern-Sternberg captured Mongolia's capital of Ulaanbaatar, but he was apprehended and executed after returning to Russia to fight the Bolsheviks.",
    question: "What can be inferred about Baron Ungern-Sternberg from the passage?",
    options: [
      { label: "a", text: "He was converted to Buddhism by Bogd Kahn." },
      { label: "b", text: "He sided with the Bolsheviks during the revolution." },
      { label: "c", text: "He changed his mind about freeing the Mongolians." },
      { label: "d", text: "He exploited Mongolian bitterness over Chinese rule." },
    ],
    answer: "d",
  },

  // ──────────────── PART IV ────────────────
  {
    id: 26,
    part: "IV",
    partLabel: "장문 독해 (26~27)",
    passageTitle: "Advice Column — Want Some Advice? Ask Betty Knows-it-all",
    passage:
      "Dear Betty Knows-it-all:\nEver since my son turned 13, our relationship has been strained. It was never like this when he was younger. These days, he is always comparing me unfavorably with his father, who is far more flexible when it comes to following rules. The other day, my son said something particularly hurtful, and I snapped, saying some bad things about his father, which I regret. I'm afraid this might happen again. What should I do?\n—Susan G.\n\nBetty Knows-it-all's Response:\nDear Susan,\nMany parents have similar experiences. They're natural. Relationships often become strained as our children move into adolescence. This is a time when children need to discover their own identities. This can be stressful, and for teens, one way to cope is to lash out at the people around them. That your son is choosing to target you rather than his father may show that he sees you as the more stable parent. We all lose our temper from time to time, but it would be best if you set an example for your son by apologizing to him for your behavior.",
    question: "Q26. Which of the following is correct about Susan?",
    options: [
      { label: "a", text: "She has always had a difficult time with her son." },
      { label: "b", text: "She is stricter than her husband in parenting." },
      { label: "c", text: "She said hurtful things to her husband." },
      { label: "d", text: "She feels relieved after her outburst." },
    ],
    answer: "b",
    groupId: 1,
  },
  {
    id: 27,
    part: "IV",
    partLabel: "장문 독해 (26~27)",
    passageTitle: "Advice Column — Want Some Advice? Ask Betty Knows-it-all",
    passage:
      "Dear Betty Knows-it-all:\nEver since my son turned 13, our relationship has been strained. It was never like this when he was younger. These days, he is always comparing me unfavorably with his father, who is far more flexible when it comes to following rules. The other day, my son said something particularly hurtful, and I snapped, saying some bad things about his father, which I regret. I'm afraid this might happen again. What should I do?\n—Susan G.\n\nBetty Knows-it-all's Response:\nDear Susan,\nMany parents have similar experiences. They're natural. Relationships often become strained as our children move into adolescence. This is a time when children need to discover their own identities. This can be stressful, and for teens, one way to cope is to lash out at the people around them. That your son is choosing to target you rather than his father may show that he sees you as the more stable parent. We all lose our temper from time to time, but it would be best if you set an example for your son by apologizing to him for your behavior.",
    question: "Q27. What is the main point of Betty Knows-it-all's response?",
    options: [
      { label: "a", text: "Susan needs to apologize to her husband." },
      { label: "b", text: "Susan's situation is actually quite normal." },
      { label: "c", text: "Susan's son is expressing anger with his father." },
      { label: "d", text: "Susan needs to show more patience with her son." },
    ],
    answer: "b",
    groupId: 1,
  },
  {
    id: 28,
    part: "IV",
    partLabel: "장문 독해 (28~29)",
    passageTitle: "Did you know... (Tea Origins)",
    passage:
      "In China, people have drunk tea for thousands of years. Many stories exist as to the roots of tea drinking. One of the more vivid of these comes from the Chinese Buddhist tradition. According to adherents of this tradition, tea drinking goes back to Siddhartha Gautama, later known as the Buddha, the founder of Buddhism.\n\nSupposedly, the young Siddhartha was wandering in the mountains one day when he decided to stop and meditate. Exhausted from his travels, he quickly drowsed off. When he woke up, he was suddenly angry that his exhaustion had prevented him from reaching his aim. In frustration, he tore out his eyelashes and threw them aside. Upon landing on the ground, his eyelashes were magically transformed into tea plants, whose leaves had fine hairs that resemble eyelashes. It is said that the Buddha later gave his followers this plant, whose power to stimulate the mind helped them in their own quests for enlightenment.",
    question: "Q28. What is the main topic of the passage?",
    options: [
      { label: "a", text: "The consumption of tea to aid in meditation" },
      { label: "b", text: "A traditional Buddhist way of preparing tea" },
      { label: "c", text: "A legend regarding the origins of tea drinking" },
      { label: "d", text: "The use of tea in Buddhist religious ceremonies" },
    ],
    answer: "c",
    groupId: 2,
  },
  {
    id: 29,
    part: "IV",
    partLabel: "장문 독해 (28~29)",
    passageTitle: "Did you know... (Tea Origins)",
    passage:
      "In China, people have drunk tea for thousands of years. Many stories exist as to the roots of tea drinking. One of the more vivid of these comes from the Chinese Buddhist tradition. According to adherents of this tradition, tea drinking goes back to Siddhartha Gautama, later known as the Buddha, the founder of Buddhism.\n\nSupposedly, the young Siddhartha was wandering in the mountains one day when he decided to stop and meditate. Exhausted from his travels, he quickly drowsed off. When he woke up, he was suddenly angry that his exhaustion had prevented him from reaching his aim. In frustration, he tore out his eyelashes and threw them aside. Upon landing on the ground, his eyelashes were magically transformed into tea plants, whose leaves had fine hairs that resemble eyelashes. It is said that the Buddha later gave his followers this plant, whose power to stimulate the mind helped them in their own quests for enlightenment.",
    question: "Q29. According to the passage, why did Siddhartha become angry?",
    options: [
      { label: "a", text: "He could find no tea to help him meditate." },
      { label: "b", text: "He fell asleep during an attempt to meditate." },
      { label: "c", text: "He was unable to meditate without drinking tea." },
      { label: "d", text: "He was interrupted by followers while meditating." },
    ],
    answer: "b",
    groupId: 2,
  },
  {
    id: 30,
    part: "IV",
    partLabel: "장문 독해 (30~31)",
    passageTitle: "Understanding and Managing Overtourism — Thrive Magazine",
    passage:
      "In recent years, overtourism has become a serious social issue in many parts of the world. Overtourism occurs when the number of travelers to an area becomes so high that it negatively affects the experience of visitors and undermines the quality of life for locals. In some countries, locals overtly show hostility towards tourists or even make separate routes for them.\n\nSeveral factors contribute to creating this unfortunate situation. With the emergence of the sharing economy, private housing rentals have significantly increased, leading tourists to stay in many new areas of cities instead of just near the tourist sites. Governments' aggressive tourism policies, intended to boost revenues and growth, have also partially contributed to the problem. Some destinations have also seen the number of visitors explode after these places have gone viral on social media.\n\nFortunately, some countries have begun to consider ways of addressing issues caused by overtourism. These options can include imposing regulations on platforms that provide private housing rental services and temporarily closing tourist attractions that have become polluted from overtourism. Also, promoting tourism during off-seasons can be an effective way to discourage overcrowding during peak seasons.",
    question: "Q30. Which of the following is mentioned as a contributor to overtourism?",
    options: [
      { label: "a", text: "The absence of government support" },
      { label: "b", text: "Online publicity about destinations" },
      { label: "c", text: "More affordable travel costs" },
      { label: "d", text: "Off-season promotions" },
    ],
    answer: "b",
    groupId: 3,
  },
  {
    id: 31,
    part: "IV",
    partLabel: "장문 독해 (30~31)",
    passageTitle: "Understanding and Managing Overtourism — Thrive Magazine",
    passage:
      "In recent years, overtourism has become a serious social issue in many parts of the world. Overtourism occurs when the number of travelers to an area becomes so high that it negatively affects the experience of visitors and undermines the quality of life for locals. In some countries, locals overtly show hostility towards tourists or even make separate routes for them.\n\nSeveral factors contribute to creating this unfortunate situation. With the emergence of the sharing economy, private housing rentals have significantly increased, leading tourists to stay in many new areas of cities instead of just near the tourist sites. Governments' aggressive tourism policies, intended to boost revenues and growth, have also partially contributed to the problem. Some destinations have also seen the number of visitors explode after these places have gone viral on social media.\n\nFortunately, some countries have begun to consider ways of addressing issues caused by overtourism. These options can include imposing regulations on platforms that provide private housing rental services and temporarily closing tourist attractions that have become polluted from overtourism. Also, promoting tourism during off-seasons can be an effective way to discourage overcrowding during peak seasons.",
    question: "Q31. What is the main topic of the third paragraph?",
    options: [
      { label: "a", text: "Methods for dealing with overtourism" },
      { label: "b", text: "Policies for increasing tourism revenue" },
      { label: "c", text: "Measures to effectively promote tourism" },
      { label: "d", text: "Reasons for suppressing overseas tourism" },
    ],
    answer: "a",
    groupId: 3,
  },
  {
    id: 32,
    part: "IV",
    partLabel: "장문 독해 (32~33)",
    passageTitle: "A \"Bugg\" in the System — The Dispatcher (June 30, 2020)",
    passage:
      "Last month, self-published author Roger Richmond logged into his Bookbugg account to see whether he had finally sold any copies of his novels Down With All and Down With All 2 on the self-publishing site. It was then that he noticed another book bearing his name: Down With All 3. Having never authored any such book, Richmond was baffled. He was even more shocked when he noticed the book's price tag: $23,000. Richmond knew that no one was likely to fork out such an enormous amount of money for the fake book. Even so, he reported the matter to Bookbugg, which immediately removed the title from its website.\n\nSo how did this strange book appear on the website in the first place? It turns out that money launderers have been taking advantage of Bookbugg. They quickly produce books filled with algorithmically generated gibberish. These books are then listed for prohibitive sums of money and given the names of obscure authors to limit the chances of them being discovered. Bookbugg admits that several illegal transactions have occurred in this way but insists that measures have now been taken to prevent this from happening again.",
    question: "Q32. What criminal activity was Bookbugg being used for?",
    options: [
      { label: "a", text: "The transfer of unlawfully earned funds" },
      { label: "b", text: "The illegal resale of copyrighted material" },
      { label: "c", text: "The unauthorized collection of customer data" },
      { label: "d", text: "The advertising and sale of unavailable books" },
    ],
    answer: "a",
    groupId: 4,
  },
  {
    id: 33,
    part: "IV",
    partLabel: "장문 독해 (32~33)",
    passageTitle: "A \"Bugg\" in the System — The Dispatcher (June 30, 2020)",
    passage:
      "Last month, self-published author Roger Richmond logged into his Bookbugg account to see whether he had finally sold any copies of his novels Down With All and Down With All 2 on the self-publishing site. It was then that he noticed another book bearing his name: Down With All 3. Having never authored any such book, Richmond was baffled. He was even more shocked when he noticed the book's price tag: $23,000. Richmond knew that no one was likely to fork out such an enormous amount of money for the fake book. Even so, he reported the matter to Bookbugg, which immediately removed the title from its website.\n\nSo how did this strange book appear on the website in the first place? It turns out that money launderers have been taking advantage of Bookbugg. They quickly produce books filled with algorithmically generated gibberish. These books are then listed for prohibitive sums of money and given the names of obscure authors to limit the chances of them being discovered. Bookbugg admits that several illegal transactions have occurred in this way but insists that measures have now been taken to prevent this from happening again.",
    question: "Q33. What can be inferred about Down With All 3 from the report?",
    options: [
      { label: "a", text: "It contains computer-generated text." },
      { label: "b", text: "It was purchased by innocent customers." },
      { label: "c", text: "It completes the author's planned trilogy." },
      { label: "d", text: "It was printed by an unlicensed company." },
    ],
    answer: "a",
    groupId: 4,
  },
  {
    id: 34,
    part: "IV",
    partLabel: "장문 독해 (34~35)",
    passageTitle: "Electroshock Therapy",
    passage:
      "Once a popular mental health treatment, electroshock therapy has fallen out of favor and is now widely seen as a barbaric artifact of medical history. Indeed, electroshock treatment can be frightening to behold, as it relies on inducing convulsions that can cause patients temporary or even permanent memory loss. Yet electroshock therapy does have a certain degree of effectiveness that we would be unwise to ignore. Though we remain a bit in the dark as to how exactly it functions, the treatment can help mitigate the most dangerous symptoms of a range of disorders, including mania and severe depression. It is true that the therapy provides only temporary relief, as symptoms tend to reemerge in a few months. However, if we could remove the stigma surrounding this treatment, we would surely find that there are cases in which patients suffering from debilitating psychological disorders would gladly accept its trade-offs.",
    question: "Q34. Which of the following is correct about electroshock therapy?",
    options: [
      { label: "a", text: "It is gaining popularity despite being shunned in the past." },
      { label: "b", text: "It is used to deliberately cause convulsions in patients." },
      { label: "c", text: "Scientists have only recently discovered how it functions." },
      { label: "d", text: "It permanently cures patients suffering from mania." },
    ],
    answer: "b",
    groupId: 5,
  },
  {
    id: 35,
    part: "IV",
    partLabel: "장문 독해 (34~35)",
    passageTitle: "Electroshock Therapy",
    passage:
      "Once a popular mental health treatment, electroshock therapy has fallen out of favor and is now widely seen as a barbaric artifact of medical history. Indeed, electroshock treatment can be frightening to behold, as it relies on inducing convulsions that can cause patients temporary or even permanent memory loss. Yet electroshock therapy does have a certain degree of effectiveness that we would be unwise to ignore. Though we remain a bit in the dark as to how exactly it functions, the treatment can help mitigate the most dangerous symptoms of a range of disorders, including mania and severe depression. It is true that the therapy provides only temporary relief, as symptoms tend to reemerge in a few months. However, if we could remove the stigma surrounding this treatment, we would surely find that there are cases in which patients suffering from debilitating psychological disorders would gladly accept its trade-offs.",
    question: "Q35. Which statement about electroshock therapy would the writer most likely agree with?",
    options: [
      { label: "a", text: "It should be used today to help treat memory loss." },
      { label: "b", text: "It may be a useful form of therapy for selected patients." },
      { label: "c", text: "It provides far more benefits than risks to most patients." },
      { label: "d", text: "It can cure patients with severe psychological disorders." },
    ],
    answer: "b",
    groupId: 5,
  },
];
