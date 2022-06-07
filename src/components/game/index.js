import style from './style.css';
import { GameHeader } from '../gameHeader';
import { difficulty as enumDifficulty } from '../../server/util-enum';
import { Board } from '../board';
import { Debug } from '../debug';
import { useState, useEffect } from 'preact/hooks';

const mapClientToServerDiff = pDiff => {
    if (pDiff === 'easy') { return enumDifficulty.easy; }
    if (pDiff === 'hard') { return enumDifficulty.hard; }
    
    return enumDifficulty.normal;
};

export const Game = () => {
    const [ data, setData ] = useState(null);
    const [ diff, setDiff ] = useState('normal');
    const [ reset, setReset ] = useState(false);
    const [ blockData, setBlockData ] = useState(null);
    const [ status, setStatus ] = useState('starting');

    useEffect(() => {
        setReset(true);
    }, [ diff ]);

    useEffect(async () => {
        if (!reset) { return; }

        setReset(false);
        const tData = await fnFetchData(diff);
        setData(tData);
        setStatus(tData.status);
    }, [ reset ]);

    const fnFetchData = async (pDiff) => {
        return (await fetch('/api/new-game', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({ difficulty: mapClientToServerDiff(pDiff) })
        })).json();
    };

    const changeDifficulty = (pDiff) => {
        setDiff(pDiff);
        setReset(true);
    };

    useEffect(() => {
        if (!data) { return; }

        const tSize = data.size;
        setBlockData(Array.from({ length: tSize[0] * tSize[1] }, (_, pIndex) => ({
            number: pIndex,
            clicked: false,
            type: 'blank',
            value: '',
        })));

    }, [ reset, data ]);

    const handleSquareClick = async (pNumber) => {
        if ([ 'won', 'lost' ].includes(status)) { return; }

        const tBlockData = [...blockData];
        const tBlock = tBlockData.find(pItem => pItem.number === pNumber);
        if (tBlock.clicked) { return; }
        
        const tData = await (await fetch('/api/open-block', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ id: data.id, block: pNumber })
        })).json();

        tData.blocks.forEach(pItem => {
            const tIndex = pItem.index;
            tBlockData[tIndex] = {
                ...tBlockData[tIndex],
                clicked: true,
                type: pItem.type,
                value: pItem.value,
            };
        });

        setBlockData(tBlockData);
        setStatus(tData.gameStatus);
    };

    if (!blockData) return <div class={style.game}>Loading...</div>

    return (
        <div class={style.game}>
            <GameHeader onChangeDifficulty={(pDiff) => changeDifficulty(pDiff)} status={status}></GameHeader>
            <Board onClick={(pNumber) => handleSquareClick(pNumber)} blockData={blockData} numberOfRows={data.size[1]} numberOfCols={data.size[0]}></Board>
            <Debug data={data} onSquareClick={handleSquareClick}></Debug>
        </div>
    );
};
