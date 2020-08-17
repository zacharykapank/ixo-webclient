import React from 'react';
import { customControls } from '../../../../common/components/JsonForm/types';
import MultiControlForm from '../../../../common/components/JsonForm/MultiControlForm/MultiControlForm';
import { FormCardProps } from '../../../CreateEntity/types';

interface Props extends FormCardProps {
  displayName: string
  location: string
  email: string
  website: string
  mission: string
  ownerId: string
  fileSrc: string
  uploadingImage: boolean
}

const OwnerCard: React.FunctionComponent<Props> = React.forwardRef(
  (
    {
      displayName,
      location,
      email,
      website,
      mission,
      ownerId,
      fileSrc,
      uploadingImage,
      handleUpdateContent,
      handleSubmitted,
      handleError,
    },
    ref,
  ) => {
    const formData = {
      displayName,
      location,
      email,
      website,
      mission,
      ownerId,
      fileSrc,
    };

    const schema = {
      type: 'object',
      required: ['ownerId'],
      properties: {
        fileSrc: { type: 'string', title: 'Logo or Profile Pic' },
        empty: { type: 'null' },
        displayName: { type: 'string', title: 'Display Name' },
        location: { type: 'string', title: 'Country of Origin' },
        email: { type: 'string', title: 'Public Email', format: 'email' },
        website: { type: 'string', title: 'Public Website', format: 'uri' },
        mission: { type: 'string', title: 'Mission' },
        ownerId: { type: 'string', title: 'Identifier' },
      },
    } as any;

    const uiSchema = {
      fileSrc: {
        'ui:widget': customControls.imageupload,
        'ui:uploading': uploadingImage,
        'ui:maxDimension': 440,
        'ui:previewWidth': 440,
        'ui:aspect': 1,
        'ui:circularCrop': false,
      },
      displayName: {
        'ui:widget': 'text',
        'ui:placeholder': 'Enter Title',
      },
      location: {
        'ui:widget': customControls.countryselector,
      },
      email: {
        'ui:widget': 'text',
        'ui:placeholder': 'Enter Email',
      },
      website: {
        'ui:widget': 'text',
        'ui:placeholder': 'Enter /Paste URL',
      },
      mission: {
        'ui:widget': 'text',
        'ui:placeholder': 'Short Description',
      },
      ownerId: {
        'ui:widget': 'text',
        'ui:placeholder': 'Enter ID or !name',
      },
    };

    return (
      <MultiControlForm
        ref={ref}
        onSubmit={handleSubmitted}
        onFormDataChange={handleUpdateContent}
        onError={handleError}
        formData={formData}
        schema={schema}
        uiSchema={uiSchema}
        multiColumn
      >
        &nbsp;
      </MultiControlForm>
    );
  },
);

export default OwnerCard;
