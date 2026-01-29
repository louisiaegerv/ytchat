I need you to help me think through the layout and design of the Collection detail pages, which users access from the @/app/library/page.tsx @/components/library/CollectionManager.tsx by clicking on a @/components/library/CollectionCard.tsx .

For context, the collection details page should let users do the following:

- manage videos in the collection (probably not add new ones, but probably remove)
- access individual videos detail pages by clicking them or some other best practice design method
- let users do AI custom prompts against the entire collection list of videos or a subset of videos in the collection (so probably need a bulk action panel). We would pass in the transcripts of the videos and use gemini 2.5 flash lite from Openrouter utils.
-

In addition to the above items, please provide your thoughts on what else users should be able to do from inside the collection detail page.
