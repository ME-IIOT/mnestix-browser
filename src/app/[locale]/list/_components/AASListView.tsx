'use client';
import { useRouter } from 'next/navigation';
import { useApis } from 'components/azureAuthentication/ApiProvider';
import { CenteredLoadingSpinner } from 'components/basics/CenteredLoadingSpinner';
import { useEnv } from 'app/env/provider';
import { useEffect, useState } from 'react';
import { AasListEntry } from 'lib/api/generated-api/clients.g';
import { useNotificationSpawner } from 'lib/hooks/UseNotificationSpawner';
import { FormattedMessage, useIntl } from 'react-intl';
import { getProductClassId, parseProductClassFromString, ProductClass } from 'lib/util/ProductClassResolverUtil';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Checkbox,
    Chip,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import { ShellIcon } from 'components/custom-icons/ShellIcon';
import { encodeBase64 } from 'lib/util/Base64Util';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import TireRepairIcon from '@mui/icons-material/TireRepair';
import FireHydrantAltIcon from '@mui/icons-material/FireHydrantAlt';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import LabelIcon from '@mui/icons-material/Label';
import { messages } from 'lib/i18n/localization';
import { showError } from 'lib/util/ErrorHandlerUtil';
import { useAsyncEffect } from 'lib/hooks/UseAsyncEffect';
import { useAasState } from 'components/contexts/CurrentAasContext';

const StyledImage = styled('img')(() => ({
    maxHeight: '88px',
    maxWidth: '88px',
    width: '100%',
    objectFit: 'scale-down',
}));

export const AASListView = () => {
    const { aasListClient } = useApis();
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [aasList, setAasList] = useState<AasListEntry[]>();
    const [aasListFiltered, setAasListFiltered] = useState<AasListEntry[]>();
    const [productClassFilterValue, setProductClassFilterValue] = useState<string>('');
    const [selectedAasList, setSelectedAasList] = useState<string[]>();
    const [productClass, setProductClass] = useState<ProductClass[]>([]);
    const notificationSpawner = useNotificationSpawner();
    const intl = useIntl();
    const navigate = useRouter();
    const theme = useTheme();
    const env = useEnv();
    const [, setAas] = useAasState();
    const MAX_SELECTED_ITEMS = 3;

    useAsyncEffect(async () => {
        try {
            setIsLoadingList(true);
            const list = await aasListClient.getAasListEntries();
            setAasList(list);
            if (!productClassFilterValue) setAasListFiltered(list);
        } catch (e) {
            showError(e, notificationSpawner);
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    /**
     * Creates the ProductClass Filter values.
     */
    useEffect(() => {
        const productClasses: ProductClass[] = [];
        if (aasList) {
            aasList.forEach((aas) => {
                if (!aas.productGroup) return;
                const productClassId = getProductClassId(aas.productGroup);
                let productClassString;
                try {
                    productClassString = intl.formatMessage(messages.mnestix.aasList.productClasses[productClassId]);
                } catch (e) {
                    console.warn('Invalid product type', e);
                }
                if (!productClassString) {
                    productClassString = getProductClassId(aas.productGroup);
                }
                const productClass = parseProductClassFromString(productClassId, productClassString);
                if (!productClasses.find((element) => element.id === productClass.id)) {
                    productClasses.push(productClass);
                }
            });
        }
        setProductClass(productClasses);
    }, [aasList]);

    const translateListText = (property: { [key: string]: string } | undefined) => {
        if (!property) return '';
        return property[intl.locale] ?? Object.values(property)[0] ?? '';
    };

    const navigateToAas = (listEntry: AasListEntry) => {
        setAas(null);
        if (listEntry.aasId) navigate.push(`/viewer/${encodeBase64(listEntry.aasId)}`);
    };

    const navigateToCompare = () => {
        const encodedAasList = selectedAasList?.map((aasId) => {
            return encodeURIComponent(aasId);
        });
        const searchString = encodedAasList?.join('&aasId=');
        navigate.push(`/compare?aasId=${searchString}`);
    };

    /**
     * Decides if the current checkbox should be disabled or not.
     */
    const checkBoxDisabled = (aasId: string | undefined) => {
        if (!aasId) return false;
        return selectedAasList && selectedAasList.length >= MAX_SELECTED_ITEMS && !selectedAasList.includes(aasId);
    };

    /**
     * Shows a warning, indicating that no more aas can be selected.
     */
    const showMaxElementsNotification = () => {
        notificationSpawner.spawn({
            message: (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    <FormattedMessage {...messages.mnestix.aasList.maxElementsWarning} />
                </Typography>
            ),
            severity: 'warning',
        });
    };

    /**
     * Shortens the property text and provides the full text in a tooltip.
     */
    const tooltipText = (property: string | undefined, maxChars: number) => {
        if (!property) return '';
        else {
            return property.length > maxChars ? (
                <Tooltip title={property} arrow>
                    <Box component="span">{`${property.slice(0, maxChars)} (...)`}</Box>
                </Tooltip>
            ) : (
                <>{property}</>
            );
        }
    };

    /**
     * Returns an icon component based on the provided product class type.
     * @param productClassType - product class type
     */
    const getProductClassIcon = (productClassType: string) => {
        switch (productClassType) {
            case 'pneumatics':
                return <TireRepairIcon color={'primary'} />;
            case 'hydraulics':
                return <FireHydrantAltIcon color={'primary'} />;
            default:
                return <LabelIcon color={'primary'} />;
        }
    };

    /**
     * Returns a chip component adjusted for product class element
     */
    const productClassValue = (productClassId: string | null, maxChars: number) => {
        if (!productClassId) return '';
        let productClass;
        try {
            productClass = parseProductClassFromString(
                productClassId,
                intl.formatMessage(messages.mnestix.aasList.productClasses[productClassId]),
            );
        } catch (e) {
            console.warn('Invalid product type', e);
        }
        if (!productClass) {
            productClass = parseProductClassFromString(productClassId, productClassId);
        }
        return (
            <Chip
                sx={{ paddingX: '16px', paddingY: '6px' }}
                color={'primary'}
                label={tooltipText(productClass.description, maxChars)}
                variant="outlined"
                icon={getProductClassIcon(productClass.type)}
                data-testid="product-class-chip"
            />
        );
    };

    /**
     * Applies product filter change to the list.
     * @param event
     */
    const handleFilterChange = (event: SelectChangeEvent) => {
        setProductClassFilterValue(event.target.value);
        if (!aasList) return;
        if (event.target.value === '') {
            setAasListFiltered(aasList);
        } else {
            const filteredList = aasList.filter((aas) => {
                return aas.productGroup && aas.productGroup.startsWith(event.target.value);
            });
            setAasListFiltered(filteredList);
        }
    };
    const SelectProductType = () => {
        return (
            <FormControl variant="standard" sx={{ minWidth: 120, marginTop: '16px', width: '265px' }}>
                <InputLabel id="product-select">
                    <FormattedMessage {...messages.mnestix.aasList.productClassHeading} />
                </InputLabel>
                <Select
                    labelId="product-select"
                    value={productClassFilterValue}
                    label={<FormattedMessage {...messages.mnestix.aasList.productClassHeading} />}
                    data-testid="product-class-select"
                    onChange={handleFilterChange}
                >
                    <MenuItem value="" data-testid="product-class-select-all">
                        <FormattedMessage {...messages.mnestix.aasList.showAll} />
                    </MenuItem>
                    {productClass.map((productType) => {
                        return (
                            <MenuItem
                                key={productType.id}
                                value={productType.id}
                                data-testid={`product-class-select-${productType.description.replace(' ', '-')}`}
                            >
                                <Typography display="flex" justifyItems="center">
                                    {getProductClassIcon(productType.type)}
                                    <Box component="span" sx={{ marginLeft: '5px' }}>
                                        {tooltipText(productType.description, 25)}
                                    </Box>
                                </Typography>
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        );
    };

    const tableBodyText = {
        lineHeight: '150%',
        fontSize: '16px',
        color: 'text.primary',
    };

    /**
     * Update the list of currently selected aas
     */
    const updateSelectedAasList = (isChecked: boolean, aasId: string | undefined) => {
        if (!aasId) return;
        let selected: string[] = [];

        if (isChecked) {
            selected = selected.concat(selectedAasList ? selectedAasList : [], [aasId]);
            selected = [...new Set(selected)];
        } else if (!isChecked && selectedAasList) {
            selected = selectedAasList.filter((aas) => {
                return aas !== aasId;
            });
        } else {
            return;
        }

        setSelectedAasList(selected);
    };

    return (
        <>
            {env.COMPARISON_FEATURE_FLAG && (
                <>
                    <Typography marginBottom={3}>
                        <FormattedMessage {...messages.mnestix.aasList.subtitle} />
                    </Typography>
                    <Box display="flex" gap={2} alignItems="center">
                        {selectedAasList?.map((selectedAas) => (
                            <Box display="flex" flexDirection="row" alignItems="center" key={selectedAas}>
                                <Typography data-testid={`selected-${selectedAas}`}>
                                    {tooltipText(selectedAas, 15)}
                                </Typography>
                                <IconButton onClick={() => updateSelectedAasList(false, selectedAas)}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            variant="contained"
                            onClick={navigateToCompare}
                            disabled={!selectedAasList || selectedAasList.length < 1}
                            data-testid="compare-button"
                        >
                            <FormattedMessage {...messages.mnestix.aasList.goToCompare} />
                        </Button>
                    </Box>
                    <Box>
                        <SelectProductType />
                    </Box>
                </>
            )}
            {isLoadingList && <CenteredLoadingSpinner sx={{ mt: 10 }} />}
            {!isLoadingList && aasListFiltered && (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow
                                sx={{
                                    color: 'primary',
                                    lineHeight: '150%',
                                    letterSpacing: '0.16px',
                                    fontSize: '16px',
                                }}
                            >
                                {env.COMPARISON_FEATURE_FLAG && (
                                    <TableCell align="center" width="50px">
                                        <Tooltip
                                            title={<FormattedMessage {...messages.mnestix.aasList.compareTooltip} />}
                                            arrow
                                        >
                                            <CompareArrowsIcon
                                                sx={{ width: '35px', height: '35px', verticalAlign: 'middle' }}
                                            />
                                        </Tooltip>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Typography fontWeight="bold">
                                        <FormattedMessage {...messages.mnestix.aasList.picture} />
                                    </Typography>
                                </TableCell>
                                <TableCell align="left">
                                    <Typography fontWeight="bold">
                                        <FormattedMessage {...messages.mnestix.aasList.manufacturerHeading} />
                                    </Typography>
                                </TableCell>
                                <TableCell align="left">
                                    <Typography fontWeight="bold">
                                        <FormattedMessage {...messages.mnestix.aasList.productDesignationHeading} />
                                    </Typography>
                                </TableCell>
                                <TableCell align="left">
                                    <Typography fontWeight="bold">
                                        <FormattedMessage {...messages.mnestix.aasList.assetIdHeading} /> /{' '}
                                        <FormattedMessage {...messages.mnestix.aasList.aasIdHeading} />
                                    </Typography>
                                </TableCell>
                                <TableCell align="left">
                                    <Typography fontWeight="bold">
                                        <FormattedMessage {...messages.mnestix.aasList.productClassHeading} />
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {aasListFiltered?.map((aasListEntry) => (
                                <TableRow
                                    key={aasListEntry.aasId}
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        backgroundColor: theme.palette?.common?.white,
                                    }}
                                    data-testid={`list-row-${aasListEntry.aasId}`}
                                >
                                    {env.COMPARISON_FEATURE_FLAG && (
                                        <TableCell align="center" sx={tableBodyText}>
                                            <Box
                                                component="span"
                                                onClick={() => {
                                                    if (checkBoxDisabled(aasListEntry.aasId))
                                                        showMaxElementsNotification();
                                                }}
                                            >
                                                <Checkbox
                                                    checked={
                                                        !!(
                                                            selectedAasList &&
                                                            selectedAasList.some((el) => el == aasListEntry.aasId)
                                                        )
                                                    }
                                                    disabled={checkBoxDisabled(aasListEntry.aasId)}
                                                    onChange={(evt) =>
                                                        updateSelectedAasList(evt.target.checked, aasListEntry.aasId)
                                                    }
                                                    data-testid="list-checkbox"
                                                />
                                            </Box>
                                        </TableCell>
                                    )}
                                    <TableCell component="th" scope="row" sx={tableBodyText}>
                                        <Paper
                                            onClick={() => navigateToAas(aasListEntry)}
                                            sx={{
                                                width: '88px',
                                                height: '88px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                '&:hover': {
                                                    boxShadow: 6,
                                                    cursor: 'pointer',
                                                },
                                            }}
                                            data-testid="list-thumbnail"
                                        >
                                            {aasListEntry.thumbnailUrl ? (
                                                <StyledImage src={aasListEntry.thumbnailUrl} />
                                            ) : (
                                                <ShellIcon fontSize="large" color="primary" />
                                            )}
                                        </Paper>
                                    </TableCell>
                                    <TableCell align="left" sx={tableBodyText}>
                                        {translateListText(aasListEntry.manufacturerName)}
                                    </TableCell>
                                    <TableCell align="left" sx={tableBodyText}>
                                        {tooltipText(
                                            translateListText(aasListEntry.manufacturerProductDesignation),
                                            100,
                                        )}
                                    </TableCell>
                                    <TableCell align="left" sx={tableBodyText}>
                                        <Typography fontWeight="bold" sx={{ letterSpacing: '0.16px' }}>
                                            <FormattedMessage {...messages.mnestix.aasList.assetIdHeading} />
                                        </Typography>
                                        {tooltipText(aasListEntry.assetId, 100)} <br />
                                        <Typography fontWeight="bold" sx={{ letterSpacing: '0.16px' }}>
                                            <FormattedMessage {...messages.mnestix.aasList.aasIdHeading} />
                                        </Typography>
                                        {tooltipText(aasListEntry.aasId, 100)}
                                    </TableCell>
                                    <TableCell align="left">
                                        {aasListEntry.productGroup ? (
                                            productClassValue(getProductClassId(aasListEntry.productGroup), 25)
                                        ) : (
                                            <Chip
                                                sx={{ paddingX: '16px', paddingY: '6px' }}
                                                color={'primary'}
                                                label={<FormattedMessage {...messages.mnestix.aasList.notAvailable} />}
                                                variant="outlined"
                                                icon={<LabelOffIcon color={'primary'} />}
                                                data-testid="product-class-chip"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Grid container spacing={2} sx={{ marginTop: '16px' }}>
                {aasListFiltered?.map((listEntry) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={listEntry.aasId}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardMedia>
                                <StyledImage src={listEntry.thumbnailUrl} alt={listEntry.aasId} />
                            </CardMedia>
                            <CardContent sx={{ flexGrow: 1 }}>
                                {/* <Typography variant="h6">{tooltipText(listEntry.name, 50)}</Typography>
                                <Typography variant="body2">{tooltipText(listEntry.manufacturer, 50)}</Typography>
                                {productClassValue(listEntry.productGroup, 50)} */}
                                cardcontent text
                            </CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                }}
                            >
                                {/* <Checkbox
                                    checked={isItemSelected(listEntry.aasId)}
                                    onChange={handleCheckboxChange(listEntry.aasId)}
                                    disabled={checkBoxDisabled(listEntry.aasId)}
                                /> */}
                                <Button size="small" onClick={() => navigateToAas(listEntry)}>
                                    viewbutton
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {/* {selectedAasList && selectedAasList.length > 0 && (
                <Box sx={{ marginTop: '16px' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CompareArrowsIcon />}
                        onClick={navigateToCompare}
                        disabled={selectedAasList.length < 2}
                    >
                        <FormattedMessage {...messages.mnestix.aasList.compareTooltip} />
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CloseIcon />}
                        onClick={() => {}}
                        sx={{ marginLeft: '8px' }}
                    >
                        clear selection
                    </Button>
                </Box>
            )} */}
        </>
    );
};
