export type Item = {
  id: string;
  value: string;
};
export type Items = Item[];

const text =
  "Raskolnikov was already entering the room. He came in looking as though he had the utmost difficulty not to burst out laughing again. Behind him Razumihin strode in gawky and awkward, shamefaced and red as a peony, with an utterly crestfallen and ferocious expression. His face and whole figure really were ridiculous at that moment and amply justified Raskolnikov’s laughter. Raskolnikov, not waiting for an introduction, bowed to Porfiry Petrovitch, who stood in the middle of the room looking inquiringly at them. He held out his hand and shook hands, still apparently making desperate efforts to subdue his mirth and utter a few words to introduce himself. But he had no sooner succeeded in assuming a serious air and muttering something when he suddenly glanced again as though accidentally at Razumihin, and could no longer control himself: his stifled laughter broke out the more irresistibly the more he tried to restrain it. The extraordinary ferocity with which Razumihin received this “spontaneous” mirth gave the whole scene the appearance of most genuine fun and naturalness. Razumihin strengthened this impression as though on purpose.";

const sentences = text.split(".");

function selectSentence(sentences: string[]) {
  const index = Math.floor(Math.random() * sentences.length);
  return sentences[index];
}

function buildItem() {
  const itemLength = Math.floor(Math.random() * 5) + 1;
  let result = [];
  for (let i = 0; i < itemLength; i++) {
    result.push(selectSentence(sentences));
  }
  return result.join(". ").trim();
}

const localItems = Array.from({ length: 500 }, (_, i) => ({
  id: i.toString(),
  value: `Entry ${i}: ${buildItem()}`,
}));

export async function getItems({
  start,
  limit,
}: {
  start: number;
  limit: number;
}) {
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(localItems.slice(start, start + limit));
    }, 500);
  });
}

export async function getItemsFrom({
  after,
  limit,
}: {
  after: string;
  limit: number;
}) {
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      let index = localItems.findIndex((i) => i.id === after);
      resolve(localItems.slice(index, index + limit));
    }, 500);
  });
}

export async function getIndexFor({ id }: { id: string }) {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      let index = localItems.findIndex((item) => {
        let result = item.id === id;
        if (result) {
        }
        return result;
      });

      resolve(index);
    }, 500);
  });
}

export async function getItemsPaginated({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) {
  const start = page * limit;
  return new Promise<Items>((resolve) => {
    setTimeout(() => {
      resolve(localItems.slice(start, start + limit));
    }, 500);
  });
}

export async function countItems() {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(localItems.length);
    }, 500);
  });
}
