# Data source review — 1 November 2026

This is a rights/suitability review for the current own-model research. No
provider subscription, data purchase, outreach or member collection is created.

| Source | Publisher evidence | Current use |
| --- | --- | --- |
| Nutrition5k | Publisher permits commercial adaptation under CC BY 4.0; US cafeterias, ingredient weights and RGB images | Actual research training/evaluation, with per-image source and attribution; not UK-field acceptance |
| EPFL Food-5K / Food-11 | Publisher limits use to research purposes and says data may not be commercially distributed | Not incorporated into our commercial model pipeline |
| Cambridge AI-generated food stimuli | Publisher describes 220 AI-generated stimuli and CC BY 4.0 | Not used; synthetic images cannot establish real camera/UK-meal performance |
| Restrain Food Database | Paper describes UK-selected foods, standardised images and per-image Creative Commons licences | Candidate for per-image rights review and visual annotation; no bulk-use permission assumed from the article licence |
| Wikimedia Commons UK food photographs | Files have individual description-page licences; category metadata is not an image licence or verified food annotation | Candidate for per-image rights review and visual annotation; no images ingested from category labels |

Authoritative references checked:

- https://github.com/google-research-datasets/Nutrition5k
- https://www.epfl.ch/labs/mmspg/downloads/food-image-datasets/
- https://www.repository.cam.ac.uk/items/b98dbb43-d042-457c-b679-3726f8f3db68
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9682305/
- https://commons.wikimedia.org/wiki/Category:Food_of_the_United_Kingdom

Next data work requires explicit visible-food labels and source rights for
every retained image. Unknown/hidden ingredients, similar shots of the same
plate and source/photographer grouping need attention. A public collection of
food photographs is not by itself a validated UK meal benchmark. Member
corrections or photos must not silently become shared training data.
