import { Badge } from '@mantine/core';
import { View } from '@/features/rxsoft/types';
import { CodingConcept } from './type';
import { codingModuleLabel } from '../pages/shared';

export const codingConceptView: View<CodingConcept> = {
  endpoint: '/concepts/:id',
  title: 'Coding Concept Details',

  fieldGroups: [
    {
      title: 'Basic Information',
      fields: [
        {
          key: 'concept',
          label: 'Concept',
          col: 3,
          render: (value) => (
            <Badge color="blue" variant="light">
              {value}
            </Badge>
          ),
        },
        {
          key: 'code',
          label: 'Code',
          col: 3,
          render: (value, item) => (
            <>
              <Badge color="teal" variant="light">
                {codingModuleLabel(item?.concept)}
              </Badge>{' '}
              <Badge variant="outline">{value}</Badge>
            </>
          ),
        },
        {
          key: 'name',
          label: 'Name',
          col: 6,
        },
        {
          key: 'shortName',
          label: 'Short Name',
          col: 6,
        },
        {
          key: 'longName',
          label: 'Long Name',
          col: 6,
        },
      ],
    },

    {
      title: 'Descriptions',
      fields: [
        {
          key: 'shortDescription',
          label: 'Short Description',
          col: 12,
        },
        {
          key: 'longDescription',
          label: 'Long Description',
          col: 12,
        },
      ],
    },
    // {
    // title: "Attributes",
    // fields: [

    //   {
    //     key: "conceptValues",
    //     label: "Attributes",
    //     col: 3,
    //     render: (_, item) => {
    //       const map = Object.fromEntries(
    //         (item.conceptValues ?? []).map(v => [
    //           v.attribute.code,
    //           v.value,
    //         ])
    //       );

    //       return (
    //         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
    //           {Object.entries(map).map(([key, value]) => (
    //             <div key={key}>
    //               <strong>{key}</strong>: {value}
    //             </div>
    //           ))}
    //         </div>
    //       );
    //     },
    //   },
    // ],
    // },
    {
      title: 'Metadata',
      fields: [
        {
          key: 'id',
          label: 'ID',
          col: 6,
        },
        {
          key: 'createdAt',
          label: 'Created At',
          col: 3,
          render: (value) => new Date(value).toLocaleString(),
        },
        {
          key: 'updatedAt',
          label: 'Updated At',
          col: 3,
          render: (value) => new Date(value).toLocaleString(),
        },
      ],
    },
  ],

  // lists: [
  //   {
  //     key: "conceptValues",
  //     title: "Attributes (Concept Values)",

  //     columns: [
  //       {
  //         key: "attribute.code",
  //         label: "Attribute",
  //         render: (_, row) => row.attribute?.code,
  //       },
  //       {
  //         key: "value",
  //         label: "Value",
  //       },
  //       {
  //         key: "attribute.dataType",
  //         label: "Type",
  //         render: (_, row) => row.attribute?.dataType,
  //       },
  //     ],
  //   },

  //   {
  //     key: "externalMappings",
  //     title: "External Mappings",

  //     columns: [
  //       {
  //         key: "externalConcept",
  //         label: "External Concept",
  //       },
  //       {
  //         key: "externalCode",
  //         label: "External Code",
  //       },
  //       {
  //         key: "internalConcept",
  //         label: "Internal Concept",
  //       },
  //       {
  //         key: "internalCode",
  //         label: "Internal Code",
  //       },
  //     ],
  //   },
  // ],
};
