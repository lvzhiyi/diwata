/**
 * 模拟成功数据
 */
export const mockSuccessData: any = {
  betRecordId: '1938176075958333440',
  gameId: 'zhumeng006',
  betType: 'NORMAL_BET',
  betSubType: 'NORMAL_BET',
  credit: 4550633947367766647,
  overallRewardAmount: 60000,
  totalPayoutAmount: 60000,
  resultDetail: {
    allWheelRewardSubType: 'mega',
    resultList: [
      {
        rewardType: 'SINGLE',
        rewardSubType: 'mega',
        totalRewardAmount: 60000,
        totalRewardMultiple: 1.0,
        wheel: [
          [
            { symbolId: '1002' },
            { symbolId: '1010' },
            { symbolId: '1007' },
            { symbolId: '4010' },
            { symbolId: '1006' },
            { symbolId: '1005' }
          ],
          [
            { symbolId: '1003' },
            { symbolId: '1009' },
            { symbolId: '1008' },
            { symbolId: '4010' },
            { symbolId: '1006' },
            { symbolId: '1001' }
          ],
          [
            { symbolId: '1010' },
            { symbolId: '1006' },
            { symbolId: '1005' },
            { symbolId: '4010' },
            { symbolId: '1003' },
            { symbolId: '1009' }
          ],
          [
            null,
            { symbolId: '1010' },
            { symbolId: '1010' },
            { symbolId: '4010' },
            { symbolId: '1009' },
            null
          ],
          [
            null,
            null,
            { symbolId: '1002' },
            { symbolId: '4010' },
            null,
            null
          ]
        ],
        rewardSymbolIndexSet: [
          {
            rowIndex: 2,
            columnIndex: 3
          },
          {
            rowIndex: 1,
            columnIndex: 3
          },
          {
            rowIndex: 4,
            columnIndex: 3
          },
          {
            rowIndex: 0,
            columnIndex: 1
          },
          {
            rowIndex: 3,
            columnIndex: 1
          },
          {
            rowIndex: 3,
            columnIndex: 2
          },
          {
            rowIndex: 0,
            columnIndex: 3
          },
          {
            rowIndex: 3,
            columnIndex: 3
          },
          {
            rowIndex: 2,
            columnIndex: 0
          }
        ],
        rewardLineList: [
          {
            symbolId: '1010',
            multiple: 1.0,
            odds: 1.2,
            rewardLineType: 'FOUR',
            rewardLineSubType: 'COMMON',
            rewardLineCount: 10,
            rewardAmount: 60000,
            betAmount: 5000
          }
        ],
        freeWheelFlag: 0,
        gameRecordIds: [],
        accumulateReachMaxMultiple: false
      },
      {
        rewardType: 'NONE',
        rewardSubType: 'none',
        totalRewardAmount: 0,
        totalRewardMultiple: 1.0,
        wheel: [
          [
            { symbolId: '1002' },
            { symbolId: '1010' },
            { symbolId: '1005' },
            { symbolId: '1005' },
            { symbolId: '1006' },
            { symbolId: '1005' }
          ],
          [
            { symbolId: '1002' },
            { symbolId: '1008' },
            { symbolId: '1007' },
            { symbolId: '1006' },
            { symbolId: '1006' },
            { symbolId: '1001' }
          ],
          [
            { symbolId: '1003' },
            { symbolId: '1009' },
            { symbolId: '1008' },
            { symbolId: '1004' },
            { symbolId: '1003' },
            { symbolId: '1009' }
          ],
          [
            null,
            { symbolId: '1006' },
            { symbolId: '1005' },
            { symbolId: '1006' },
            { symbolId: '1009' },
            null
          ],
          [
            null,
            null,
            { symbolId: '1002' },
            { symbolId: '1003' },
            null,
            null
          ]
        ],
        rewardSymbolIndexSet: null,
        rewardLineList: null,
        freeWheelFlag: 0,
        gameRecordIds: [],
        accumulateReachMaxMultiple: false
      }
    ]
  }
};
  
/**
   * 模拟失败数据，生成一个未中奖的投注结果
   */
export const mockFailedData: any = {
  betRecordId: '0000000000000000000',
  gameId: 'zhumeng006',
  betType: 'NORMAL_BET',
  betSubType: 'NORMAL_BET',
  credit: 0,
  overallRewardAmount: 0,
  totalPayoutAmount: 0,
  resultDetail: {
    allWheelRewardSubType: 'none',
    resultList: [
      {
        id: '0000000000000000000',
        rewardType: 'NONE',
        rewardSubType: 'none',
        totalRewardAmount: 0,
        totalRewardMultiple: 1.0,
        wheel: [
          [
            { symbolId: '1002' },
            { symbolId: '1010' },
            { symbolId: '1005' },
            { symbolId: '1005' },
            { symbolId: '1006' },
            { symbolId: '1005' }
          ],
          [
            { symbolId: '1002' },
            { symbolId: '1008' },
            { symbolId: '1007' },
            { symbolId: '1006' },
            { symbolId: '1006' },
            { symbolId: '1001' }
          ],
          [
            { symbolId: '1003' },
            { symbolId: '1009' },
            { symbolId: '1008' },
            { symbolId: '1004' },
            { symbolId: '1003' },
            { symbolId: '1009' }
          ],
          [
            null,
            { symbolId: '1006' },
            { symbolId: '1005' },
            { symbolId: '1006' },
            { symbolId: '1009' },
            null
          ],
          [
            null,
            null,
            { symbolId: '1002' },
            { symbolId: '1003' },
            null,
            null
          ]
        ],
        rewardSymbolIndexSet: null,
        rewardLineList: null,
        freeWheelFlag: 0,
        gameRecordIds: [],
        accumulateReachMaxMultiple: false
      }
    ],
  }
};
