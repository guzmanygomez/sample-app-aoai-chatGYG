import { AskResponse, Citation } from "../../api";
import { cloneDeep } from "lodash";


export type ParsedAnswer = {
    citations: Citation[];
    markdownFormatText: string;
};

export const enumerateCitations = (citations: Citation[]) => {
    const filepathMap = new Map();
    for (const citation of citations) {
        const { filepath } = citation;
        let part_i = 1
        if (filepathMap.has(filepath)) {
            part_i = filepathMap.get(filepath) + 1;
        }
        filepathMap.set(filepath, part_i);
        citation.part_index = part_i;
    }
    return citations;
}

export function parseAnswer(answer: AskResponse): ParsedAnswer {
    let answerText = answer.answer;
    const citationLinks = answerText.match(/\[(doc\d\d?\d?)]/g);

    const lengthDocN = "[doc".length;

    let filteredCitations = [] as Citation[];
    let citationReindex = 0;
    citationLinks?.forEach(link => {
        // Replacing the links/citations with number
        let citationIndex = link.slice(lengthDocN, link.length - 1);
        let citation = cloneDeep(answer.citations[Number(citationIndex) - 1]) as Citation;
        if (!filteredCitations.find((c) => c.id === citationIndex) && citation) {
          answerText = answerText.replaceAll(link, ` ^${++citationReindex}^ `);
          citation.id = citationIndex; // original doc index to de-dupe
          citation.reindex_id = citationReindex.toString(); // reindex from 1 for display
          filteredCitations.push(citation);
        }
    })

    filteredCitations = enumerateCitations(filteredCitations);

    // TODO: This is where the answer comes from
    // Write a message in the console
    //console.log("LOG:" + markdownFormatText);

    return {
        citations: filteredCitations,
        markdownFormatText: answerText
    };
}
