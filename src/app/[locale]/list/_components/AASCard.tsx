'use client';
import React, { useState } from 'react';
import {
    useTheme,
    Card,
    Grid,
    CardMedia,
    CardContent,
    Box,
    Button,
    styled,
    IconButton,
    Typography,
    Divider,
} from '@mui/material';
import { Description, Menu, ShoppingCart } from '@mui/icons-material';
import { AasListEntry } from 'lib/api/generated-api/clients.g';
import { ShellIcon } from 'components/custom-icons/ShellIcon';
import { useApis } from 'components/azureAuthentication/ApiProvider';
import { useAsyncEffect } from 'lib/hooks/UseAsyncEffect';

// Define the props interface
interface AASCardProps {
    aasListEntry: AasListEntry;
    navigateToAas: (listEntry: AasListEntry) => void;
}

const StyledImage = styled('img')(() => ({
    maxHeight: '143px',
}));

const StyledTypography = styled(Typography)(() => ({
    height: '1.5em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
    width: '32px',
    height: '24px',
    borderRadius: '16px',
}));

const StyledAasAttributeIcon = styled(IconButton)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    width: '50px',
    height: '24px',
    position: 'absolute',
    top: '80px',
    right: '8px',
    borderRadius: '16px',
    fontSize: '0.75rem', // Decreased font size
    textTransform: 'none', // Remove capitalization
}));

// AASCard component
export const AASCard: React.FC<AASCardProps> = ({ aasListEntry, navigateToAas }) => {
    const [productImageUrl, setProductImageUrl] = useState<string | undefined>('');
    const { repositoryClient } = useApis();
    const theme = useTheme();

    const commonIconStyles = {
        color: 'transparent',
        stroke: theme.palette.grey[900],
        strokeWidth: 1,
        fontSize: 21,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    // Get the image url from aasId, set with thumbnail url if no image is found
    useAsyncEffect(async () => {
        if (!aasListEntry || !aasListEntry.aasId) return;

        try {
            const image = await repositoryClient.getThumbnailFromShell(aasListEntry.aasId);
            setProductImageUrl(URL.createObjectURL(image));
        } catch (error) {
            setProductImageUrl(aasListEntry.thumbnailUrl);
        }
    }, [aasListEntry]);

    return (
        <Grid item xs={12} sm={6} md={4} lg={3} key={aasListEntry.aasId}>
            <Card sx={{ height: '320px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <CardMedia sx={{ display: 'flex', justifyContent: 'center', height: '143px' }}>
                    {productImageUrl ? (
                        <StyledImage src={productImageUrl} alt={aasListEntry.aasId} />
                    ) : (
                        <ShellIcon fontSize="large" color="primary" />
                    )}
                    <StyledAasAttributeIcon>
                        <Typography variant="body1">{aasListEntry.aasClass}</Typography>
                    </StyledAasAttributeIcon>
                    <StyledAasAttributeIcon sx={{ top: '110px' }}>
                        <Typography variant="body1">{aasListEntry.aasVersion}</Typography>
                    </StyledAasAttributeIcon>
                </CardMedia>
                <Divider
                    sx={{
                        borderColor: '#0000004D',
                    }}
                />
                <CardContent
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                    <StyledTypography>{aasListEntry.productModel}</StyledTypography>
                </CardContent>
                <StyledIconButton
                    sx={{
                        width: '28px',
                        height: '28px',
                        marginLeft: '21px',
                        backgroundColor: 'transparent',
                        color: theme.palette.primary.main,
                        transition: 'all 0.3s ease', // Smooth transition for hover effect
                        '&:hover': {
                            color: theme.palette.primary.main, // Change fill color on hover
                            backgroundColor: 'transparent',
                            transform: 'scale(1.2)', // Slightly enlarge the icon
                        },
                    }}
                >
                    <ShoppingCart
                        sx={{
                            color: 'transparent', // Make fill color transparent
                            stroke: theme.palette.primary.main, // Set stroke color
                            strokeWidth: 1.5, // Adjust stroke width
                            fontSize: 21,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    />
                </StyledIconButton>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        mt: 'auto',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: '8px', // Controls the space between buttons
                        }}
                    >
                        <StyledIconButton>
                            <Description sx={commonIconStyles} />
                        </StyledIconButton>
                        <StyledIconButton>
                            <Menu sx={commonIconStyles} />
                        </StyledIconButton>
                    </Box>
                    <Button size="small" onClick={() => navigateToAas(aasListEntry)}>
                        more detail
                    </Button>
                </Box>
            </Card>
        </Grid>
    );
};
