/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getKerberosStartupState,
  queryDataSourceList
} from '@/service/modules/data-source'
import type { FormRules } from 'naive-ui'
import type {
  IDataSourceDetail,
  IDataBase,
  IDataBaseOption,
  IDataBaseOptionKeys,
  IDataSource
} from './types'
import utils from '@/utils'
import type { TypeReq } from '@/service/modules/data-source/types'
export function useForm(id?: number) {
  const { t } = useI18n()

  const initialValues = {
    type: 'MYSQL',
    label: 'MYSQL',
    name: '',
    note: '',
    host: '',
    port: datasourceType['MYSQL'].defaultPort,
    principal: '',
    javaSecurityKrb5Conf: '',
    loginUserKeytabUsername: '',
    loginUserKeytabPath: '',
    mode: '',
    userName: '',
    password: '',
    database: '',
    connectType: '',
    other: '',
    testFlag: -1,
    bindTestId: undefined,
    endpoint: '',
    MSIClientId: '',
    dbUser: ''
  } as IDataSourceDetail

  const state = reactive({
    detailFormRef: ref(),
    detailForm: { ...initialValues },
    requiredDataBase: true,
    showHost: true,
    showPort: true,
    showAwsRegion: false,
    showCompatibleMode: false,
    showConnectType: false,
    showPrincipal: false,
    showMode: false,
    showDataBaseName: true,
    showJDBCConnectParameters: true,
    showPublicKey: false,
    bindTestDataSourceExample: [] as { label: string; value: number }[],
    rules: {
      name: {
        trigger: ['input'],
        validator() {
          if (!state.detailForm.name) {
            return new Error(t('datasource.datasource_name_tips'))
          }
        }
      },
      host: {
        trigger: ['input'],
        validator() {
          if (!state.detailForm.host && state.showHost) {
            return new Error(t('datasource.ip_tips'))
          }
        }
      },
      port: {
        trigger: ['input'],
        validator() {
          if (state.showMode && state.detailForm.mode === 'IAM-accessKey') {
            return
          }
          if (!state.detailForm.port && state.showPort) {
            return new Error(t('datasource.port_tips'))
          }
        }
      },
      principal: {
        trigger: ['input'],
        validator() {
          if (!state.detailForm.principal && state.showPrincipal) {
            return new Error(t('datasource.principal_tips'))
          }
        }
      },
      mode: {
        trigger: ['blur'],
        validator() {
          if (!state.detailForm.mode && state.showMode) {
            return new Error(t('datasource.mode_tips'))
          }
        }
      },
      userName: {
        trigger: ['input'],
        validator() {
          if (
            !state.detailForm.userName &&
            state.detailForm.type !== 'AZURESQL'
          ) {
            return new Error(t('datasource.user_name_tips'))
          }
        }
      },
      awsRegion: {
        trigger: ['input'],
        validator() {
          if (!state.detailForm.awsRegion && state.showAwsRegion) {
            return new Error(t('datasource.aws_region_tips'))
          }
        }
      },
      database: {
        trigger: ['input'],
        validator() {
          if (!state.detailForm.database && state.requiredDataBase) {
            return new Error(t('datasource.database_name_tips'))
          }
        }
      },
      connectType: {
        trigger: ['update'],
        validator() {
          if (!state.detailForm.connectType && state.showConnectType) {
            return new Error(t('datasource.oracle_connect_type_tips'))
          }
        }
      },
      other: {
        trigger: ['input', 'blur'],
        validator() {
          if (state.detailForm.other && !utils.isJson(state.detailForm.other)) {
            return new Error(t('datasource.jdbc_format_tips'))
          }
        }
      },
      testFlag: {
        trigger: ['input'],
        validator() {
          if (-1 === state.detailForm.testFlag) {
            return new Error(t('datasource.datasource_test_flag_tips'))
          }
        }
      },
      bindTestId: {
        trigger: ['input'],
        validator() {
          if (0 === state.detailForm.testFlag && !state.detailForm.bindTestId) {
            return new Error(t('datasource.datasource_bind_test_id_tips'))
          }
        }
      },
      endpoint: {
        trigger: ['input'],
        validator() {
          if (
            !state.detailForm.endpoint &&
            state.detailForm.type === 'AZURESQL' &&
            state.detailForm.mode === 'accessToken'
          ) {
            return new Error(t('datasource.endpoint_tips'))
          }
        }
      },
      dbUser: {
        trigger: ['input'],
        validator() {
          if (
            !state.detailForm.dbUser &&
            state.showMode &&
            state.detailForm.mode === 'IAM-accessKey'
          ) {
            return new Error(t('datasource.IAM-accessKey'))
          }
        }
      }
      // databaseUserName: {
      //   trigger: ['input'],
      //   validator() {
      //     if (!state.detailForm.userName) {
      //       return new Error(t('datasource.user_name_tips'))
      //     }
      //   }
      // },
    } as FormRules,
    modeOptions: [
      {
        label: "SqlPassword",
        value: 'SqlPassword',
      },
      {
        label: "ActiveDirectoryPassword",
        value: 'ActiveDirectoryPassword',
      },
      {
        label: "ActiveDirectoryMSI",
        value: 'ActiveDirectoryMSI',
      },
      {
        label: "ActiveDirectoryServicePrincipal",
        value: 'ActiveDirectoryServicePrincipal',
      },
      {
        label: "accessToken",
        value: 'accessToken',
      },
    ],
    redShitModeOptions: [
      {
        label: 'password',
        value: 'password'
      },
      {
        label: 'IAM-accessKey',
        value: 'IAM-accessKey'
      }
    ]
  })

  const changeType = async (type: IDataBase, options: IDataBaseOption) => {
    state.detailForm.port = options.previousPort || options.defaultPort
    state.detailForm.type = type

    state.requiredDataBase = (type !== 'POSTGRESQL' && type !== 'ATHENA')

    state.showHost = type !== 'ATHENA'
    state.showPort = type !== 'ATHENA'
    state.showAwsRegion = type === 'ATHENA'
    state.showMode = ['AZURESQL', 'REDSHIFT'].includes(type)

    if (type === 'ORACLE' && !id) {
      state.detailForm.connectType = 'ORACLE_SERVICE_NAME'
    }
    state.showConnectType = type === 'ORACLE'

    state.showCompatibleMode = type == 'OCEANBASE'

    if (type === 'HIVE' || type === 'SPARK') {
      state.showPrincipal = await getKerberosStartupState()
    } else {
      state.showPrincipal = false
    }
    if (type === 'SSH') {
      state.showDataBaseName = false
      state.requiredDataBase = false
      state.showJDBCConnectParameters = false
      state.showPublicKey = true
    }else {
      state.showDataBaseName = true
      state.requiredDataBase = true
      state.showJDBCConnectParameters = true
      state.showPublicKey = false

    }

    if (state.detailForm.id === undefined) {
      await getSameTypeTestDataSource()
    }
  }

  const changePort = async () => {
    if (!state.detailForm.type) return
    const currentDataBaseOption = datasourceType[state.detailForm.type]
    currentDataBaseOption.previousPort = state.detailForm.port
  }
  const changeTestFlag = async (testFlag: IDataBase) => {
    if (testFlag) {
      state.detailForm.bindTestId = undefined
    }
    // @ts-ignore
    if (state.detailForm.id !== undefined && testFlag === 0) {
      await getSameTypeTestDataSource()
    }
  }

  const getSameTypeTestDataSource = async () => {
    const params = { type: state.detailForm.type, testFlag: 1 } as TypeReq
    const result = await queryDataSourceList(params)
    state.bindTestDataSourceExample = result
        .filter((value: { label: string; value: string }) => {
          // @ts-ignore
          if (state.detailForm.id && state.detailForm.id === value.id)
            return false
          return true
        })
        .map((TestDataSourceExample: { name: string; id: number }) => ({
        label: TestDataSourceExample.name,
        value: TestDataSourceExample.id
      }))
  }

  const resetFieldsValue = () => {
    state.detailForm = { ...initialValues }
  }

  const setFieldsValue = (values: IDataSource) => {
    state.detailForm = {
      ...state.detailForm,
      ...values,
      other: values.other ? JSON.stringify(values.other) : values.other
    }
  }

  const getFieldsValue = () => state.detailForm


  return {
    state,
    changeType,
    changePort,
    changeTestFlag,
    resetFieldsValue,
    getSameTypeTestDataSource,
    setFieldsValue,
    getFieldsValue
  }
}

export const datasourceType: IDataBaseOptionKeys = {
  MYSQL: {
    value: 'MYSQL',
    label: 'MYSQL',
    defaultPort: 3306
  },
  POSTGRESQL: {
    value: 'POSTGRESQL',
    label: 'POSTGRESQL',
    defaultPort: 5432
  },
  HIVE: {
    value: 'HIVE',
    label: 'HIVE/IMPALA',
    defaultPort: 10000
  },
  SPARK: {
    value: 'SPARK',
    label: 'SPARK',
    defaultPort: 10015
  },
  CLICKHOUSE: {
    value: 'CLICKHOUSE',
    label: 'CLICKHOUSE',
    defaultPort: 8123
  },
  ORACLE: {
    value: 'ORACLE',
    label: 'ORACLE',
    defaultPort: 1521
  },
  SQLSERVER: {
    value: 'SQLSERVER',
    label: 'SQLSERVER',
    defaultPort: 1433
  },
  DB2: {
    value: 'DB2',
    label: 'DB2',
    defaultPort: 50000
  },
  PRESTO: {
    value: 'PRESTO',
    label: 'PRESTO',
    defaultPort: 8080
  },
  REDSHIFT: {
    value: 'REDSHIFT',
    label: 'REDSHIFT',
    defaultPort: 5439
  },
  ATHENA: {
    value: 'ATHENA',
    label: 'ATHENA',
    defaultPort: 0
  },
  TRINO: {
    value: 'TRINO',
    label: 'TRINO',
    defaultPort: 8080
  },
  AZURESQL: {
    value: 'AZURESQL',
    label: 'AZURESQL',
    defaultPort: 1433
  },
  STARROCKS: {
      value: 'STARROCKS',
      label: 'STARROCKS',
      defaultPort: 9030
  },
  DAMENG: {
    value: 'DAMENG',
    label: 'DAMENG',
    defaultPort: 5236
  },
  OCEANBASE: {
    value: 'OCEANBASE',
    label: 'OCEANBASE',
    defaultPort: 2881
  },
  SSH: {
    value: 'SSH',
    label: 'SSH',
    defaultPort: 22
  }
}

export const datasourceTypeList: IDataBaseOption[] = Object.values(
  datasourceType
).map((item) => {
  item.class = 'options-datasource-type'
  return item
})
