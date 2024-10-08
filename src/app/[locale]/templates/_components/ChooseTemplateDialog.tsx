import { alpha, Box, Dialog, DialogProps, Paper, styled, Typography } from '@mui/material';
import { CenteredLoadingSpinner } from 'components/basics/CenteredLoadingSpinner';
import { messages } from 'lib/i18n/localization';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChooseTemplateItem } from './ChooseTemplateItem';
import { Submodel } from '@aas-core-works/aas-core3.0-typescript/types';
import { getTranslationText } from 'lib/util/SubmodelResolverUtil';

interface ChooseTemplateDialogProps extends DialogProps {
    defaultTemplates?: Submodel[];
    isLoading?: boolean;
    handleTemplateClick?: (template?: Submodel) => void;
}

const StyledLoadingOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette.common.white, 0.7),
}));

export function ChooseTemplateDialog(props: ChooseTemplateDialogProps) {
    const intl = useIntl();
    const { defaultTemplates, isLoading, handleTemplateClick, ...other } = props;
    return (
        <Dialog {...other} maxWidth="md">
            {isLoading && (
                <StyledLoadingOverlay>
                    <CenteredLoadingSpinner />
                </StyledLoadingOverlay>
            )}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h3" align="center">
                    <FormattedMessage {...messages.mnestix.chooseAStartingPoint} />
                </Typography>
                <Box sx={{ my: 2 }}>
                    {defaultTemplates?.map((t, i) => {
                        return (
                            <ChooseTemplateItem
                                key={i}
                                label={`${t.idShort} V${t.administration?.version ?? '-'}.${
                                    t.administration?.revision ?? '-'
                                }`}
                                subLabel={t.semanticId?.keys?.[0]?.value}
                                description={t.description ? getTranslationText(t.description, intl) : undefined}
                                onClick={() => handleTemplateClick && handleTemplateClick(t)}
                            />
                        );
                    })}
                    <ChooseTemplateItem
                        label={intl.formatMessage(messages.mnestix.emptyCustom)}
                        subLabel={intl.formatMessage(messages.mnestix.emptyCustomDescription)}
                        hasDivider={false}
                        onClick={() => handleTemplateClick && handleTemplateClick()}
                    />
                </Box>
            </Paper>
        </Dialog>
    );
}
