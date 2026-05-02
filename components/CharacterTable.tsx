import React from 'react';
import type { CharacterConcept } from '../types';
import { useLocalization } from '../hooks/useLocalization';

interface CharacterTableProps {
    concepts: CharacterConcept[];
    onCreateCard: (concept: CharacterConcept) => void;
}

export const CharacterTable: React.FC<CharacterTableProps> = ({ concepts, onCreateCard }) => {
    const { t } = useLocalization();

    return (
        <div className="overflow-x-auto rounded-lg bg-gray-800/50 backdrop-blur-sm shadow-lg border border-gray-700/50">
            <table className="w-full text-sm text-left text-gray-300 table-fixed">
                <thead className="text-xs text-gray-400 uppercase bg-gray-900/75 tracking-wider">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-center w-1/4">
                            {t('table_header_name')}
                        </th>
                        <th scope="col" className="px-4 py-2 text-center">
                            {t('table_header_description')}
                        </th>
                        <th scope="col" className="px-4 py-2 w-[120px] text-center">
                            {t('table_header_actions')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {concepts.map((concept, index) => (
                        <tr key={`${concept.name}-${index}`} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                            <th scope="row" className="px-4 py-2 font-semibold text-white align-middle text-center break-words">
                                {concept.name}
                            </th>
                            <td className="px-4 py-2 align-top text-justify break-words">
                                {concept.description}
                            </td>
                            <td className="px-4 py-2 text-center align-middle">
                                <button
                                    onClick={() => onCreateCard(concept)}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1 px-3 rounded-md transition-colors duration-200 text-sm"
                                >
                                    {t('create_button')}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};